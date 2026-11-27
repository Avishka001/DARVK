import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { query } from './db.js';
import { ensureTables } from './schema.js';
import { sendInvoiceEmail, verifyEmailConfigOnStartup, sendPasswordResetEmail } from './emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security Hardening
app.use(helmet()); // Sets robust HTTP security headers

// Strict CORS to only allow our frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting for Auth Routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for auth routes
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' }
});

app.use('/api/auth/', authLimiter);

// Custom request logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

async function ensureOrdersSchema() {
  try {
    await ensureTables();
    console.log('[Schema] Validated PostgreSQL tables in Neon');
  } catch (err: any) {
    console.error('Failed to validate schema:', err.message);
  }
}

ensureOrdersSchema();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[SECURITY ERROR] FATAL: JWT_SECRET environment variable is missing.');
  console.error('Please set a strong JWT_SECRET in your .env file to secure authentication.');
  process.exit(1); // Crash the server securely instead of falling back to a weak secret
}

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: number };
}

// Admin Authorization Middleware
function authenticateAdmin(req: AuthRequest, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: number };
    if (decoded.role !== 1) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

// User Authorization Middleware
function authenticateUser(req: AuthRequest, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: number };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

// Helper to format a database product row to frontend Product type
function mapProductRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    category: row.category,
    images: JSON.parse(row.images || '[]'),
    description: row.description || '',
    features: JSON.parse(row.features || '[]'),
    sizes: JSON.parse(row.sizes || '[]'),
    colors: JSON.parse(row.colors || '[]'),
    isNew: !!row.is_new,
    isBestSeller: !!row.is_best_seller,
    stock: Number(row.stock),
    gender: row.gender || 'unisex'
  };
}

// Map a flat JOIN row → frontend OrderDetails shape
// One row per order_item; we group by order id after fetching
function mapOrderRows(rows: any[]): any[] {
  if (rows.length === 0) return [];

  // Group rows by order id (each row is duplicated per item in the JOIN)
  const orderMap = new Map<string, any>();

  for (const row of rows) {
    if (!orderMap.has(row.order_id)) {
      const discountAmt = row.discount_amount != null ? Number(row.discount_amount) : 0;
      orderMap.set(row.order_id, {
        id: row.order_id,
        customerInfo: {
          email: row.email || '',
          firstName: row.first_name || '',
          lastName: row.last_name || '',
          address: row.address || '',
          city: row.city || '',
          postalCode: row.postal_code || '',
          country: row.country || '',
        },
        subtotal: Number(row.subtotal),
        shipping: Number(row.shipping),
        total: Number(row.total),
        paymentMethod: row.payment_method,
        date: row.created_at,
        discountCode: row.discount_code || undefined,
        discountAmount: discountAmt !== 0 ? discountAmt : undefined,
        status: row.status,
        cardBrand: row.card_brand || undefined,
        cardLast4: row.card_last4 || undefined,
        items: [],
      });
    }

    // Each row contains one order_item's columns
    if (row.item_id) {
      let images: string[] = [];
      try {
        if (row.product_images) {
          images = JSON.parse(row.product_images);
        }
      } catch (e) {
        images = [];
      }

      orderMap.get(row.order_id).items.push({
        id: row.item_id,
        product: {
          id: row.product_id,
          name: row.product_name,
          price: Number(row.product_price),
          images: images,
          category: row.product_category || 'tops',
          description: row.product_description || '',
          features: [],
          sizes: [],
          colors: [],
          stock: 0,
        },
        selectedSize: row.selected_size,
        selectedColor: { name: row.color_name, hex: row.color_hex },
        quantity: Number(row.quantity),
      });
    }
  }

  return Array.from(orderMap.values());
}

// ── 1. Products Endpoints ──────────────────────────────────────────

// GET /api/products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const result = await query`SELECT * FROM products`;
    const products = result.rows.map(mapProductRow);
    res.json(products);
  } catch (err: any) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const result = await query`SELECT * FROM products WHERE id = ${req.params.id}`;
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(mapProductRow(result.rows[0]));
  } catch (err: any) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/products (Admin Only)
app.post('/api/products', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const newProduct = req.body;
    if (!newProduct.name || newProduct.price === undefined || !newProduct.category) {
      return res.status(400).json({ error: 'Product name, price, and category are required' });
    }

    const price = Number(newProduct.price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Product price must be a positive number' });
    }

    const newId = `prod-${Date.now()}`;
    const originalPrice = typeof newProduct.originalPrice === 'number' ? Number(newProduct.originalPrice) : null;
    const images = Array.isArray(newProduct.images) ? newProduct.images : [];
    const features = Array.isArray(newProduct.features) ? newProduct.features : [];
    const sizes = Array.isArray(newProduct.sizes) && newProduct.sizes.length > 0
      ? newProduct.sizes
      : ['S', 'M', 'L', 'XL'];
    const colors = Array.isArray(newProduct.colors) && newProduct.colors.length > 0
      ? newProduct.colors
      : [{ name: 'Default Black', hex: '#111827' }];
    const isNew = typeof newProduct.isNew === 'boolean' ? newProduct.isNew : true;
    const isBestSeller = typeof newProduct.isBestSeller === 'boolean' ? newProduct.isBestSeller : false;
    const stock = Number.isFinite(Number(newProduct.stock)) ? Number(newProduct.stock) : 10;
    const gender = ['men', 'women', 'unisex'].includes(newProduct.gender) ? newProduct.gender : 'unisex';
    const imagesStr = JSON.stringify(images);
    const featuresStr = JSON.stringify(features);
    const sizesStr = JSON.stringify(sizes);
    const colorsStr = JSON.stringify(colors);

    await query`
      INSERT INTO products
        (id, name, price, original_price, category, images, description, features, sizes, colors, is_new, is_best_seller, stock, gender)
      VALUES
        (${newId}, ${newProduct.name}, ${price}, ${originalPrice}, ${newProduct.category}, ${imagesStr}, ${newProduct.description || ''}, ${featuresStr}, ${sizesStr}, ${colorsStr}, ${Boolean(isNew)}, ${Boolean(isBestSeller)}, ${stock}, ${gender})
    `;

    const createdProduct = {
      id: newId,
      name: newProduct.name,
      price,
      originalPrice: originalPrice || undefined,
      category: newProduct.category,
      images: newProduct.images || [],
      description: newProduct.description || '',
      features: newProduct.features || [],
      sizes: newProduct.sizes || ['S', 'M', 'L', 'XL'],
      colors: newProduct.colors || [{ name: 'Default Black', hex: '#111827' }],
      isNew: !!isNew,
      isBestSeller: !!isBestSeller,
      stock,
      gender
    };

    res.status(201).json(createdProduct);
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// PUT /api/products/:id (Admin Only)
app.put('/api/products/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const updatedProduct = req.body;
    if (!updatedProduct.name || updatedProduct.price === undefined || !updatedProduct.category) {
      return res.status(400).json({ error: 'Product name, price, and category are required' });
    }

    const price = Number(updatedProduct.price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Product price must be a positive number' });
    }

    const originalPrice = typeof updatedProduct.originalPrice === 'number' ? Number(updatedProduct.originalPrice) : null;
    const images = Array.isArray(updatedProduct.images) ? updatedProduct.images : [];
    const features = Array.isArray(updatedProduct.features) ? updatedProduct.features : [];
    const sizes = Array.isArray(updatedProduct.sizes) && updatedProduct.sizes.length > 0
      ? updatedProduct.sizes
      : ['S', 'M', 'L', 'XL'];
    const colors = Array.isArray(updatedProduct.colors) && updatedProduct.colors.length > 0
      ? updatedProduct.colors
      : [{ name: 'Default Black', hex: '#111827' }];
    const isNew = typeof updatedProduct.isNew === 'boolean' ? updatedProduct.isNew : true;
    const isBestSeller = typeof updatedProduct.isBestSeller === 'boolean' ? updatedProduct.isBestSeller : false;
    const stock = Number.isFinite(Number(updatedProduct.stock)) ? Number(updatedProduct.stock) : 10;
    const gender = ['men', 'women', 'unisex'].includes(updatedProduct.gender) ? updatedProduct.gender : 'unisex';
    const imagesStr = JSON.stringify(images);
    const featuresStr = JSON.stringify(features);
    const sizesStr = JSON.stringify(sizes);
    const colorsStr = JSON.stringify(colors);

    const result = await query`
      UPDATE products
      SET
        name = ${updatedProduct.name},
        price = ${price},
        original_price = ${originalPrice},
        category = ${updatedProduct.category},
        images = ${imagesStr},
        description = ${updatedProduct.description || ''},
        features = ${featuresStr},
        sizes = ${sizesStr},
        colors = ${colorsStr},
        is_new = ${Boolean(isNew)},
        is_best_seller = ${Boolean(isBestSeller)},
        stock = ${stock},
        gender = ${gender}
      WHERE id = ${productId}
    `;

    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const savedProduct = {
      id: productId,
      name: updatedProduct.name,
      price,
      originalPrice: originalPrice || undefined,
      category: updatedProduct.category,
      images: images,
      description: updatedProduct.description || '',
      features: features,
      sizes: sizes,
      colors: colors,
      isNew: !!isNew,
      isBestSeller: !!isBestSeller,
      stock,
      gender
    };

    res.json(savedProduct);
  } catch (err: any) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// DELETE /api/products/:id (Admin Only)
app.delete('/api/products/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query`DELETE FROM products WHERE id = ${req.params.id}`;
    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).end();
  } catch (err: any) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Database delete failed' });
  }
});

// ── 3. User Auth Endpoints ──────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if user exists
    const checkUser = await query`SELECT id FROM users WHERE email = ${email}`;
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user and return created row
    const newUser = await query`
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName})
      RETURNING id, email, first_name, last_name, role
    `;
    const user = newUser.rows[0];

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await query`SELECT * FROM users WHERE email = ${email}`;
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check password if it's a traditional account
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please login with Google.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/google
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, googleId } = req.body;
    if (!email || !googleId) {
      return res.status(400).json({ error: 'Google ID and email are required.' });
    }

    // Check if user exists
    let result = await query`SELECT * FROM users WHERE email = ${email}`;
    let user = result.rows[0];

    if (!user) {
      // Create new user
      result = await query`
        INSERT INTO users (email, first_name, last_name, google_id)
        VALUES (${email}, ${firstName || ''}, ${lastName || ''}, ${googleId})
        RETURNING *
      `;
      user = result.rows[0];
    } else {
      // Update google_id if missing
      if (!user.google_id) {
        await query`UPDATE users SET google_id = ${googleId} WHERE id = ${user.id}`;
      }
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Google login error:', err);
    res.status(500).json({ error: 'Internal server error during Google login.' });
  }
});

// ── 4. Discount Code Validation ───────────────────────────────────

const VALID_DISCOUNTS: Record<string, number> = {
  'AURA20': 20,
  'INCARNAGE': 20,
  'APEX10': 10,
  'SUMMER50': 50
};

// POST /api/discounts/validate
app.post('/api/discounts/validate', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Discount code is required' });
  }
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode in VALID_DISCOUNTS) {
    res.json({ valid: true, percentOff: VALID_DISCOUNTS[cleanCode] });
  } else {
    res.json({ valid: false, percentOff: 0 });
  }
});

// ── 4. Orders Endpoints ────────────────────────────────────────────

// POST /api/orders
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { items, customerInfo, discountCode, paymentMethod, card } = req.body;

    console.log('order items : ', items);
    console.log('customerInfo : ', customerInfo);
    console.log('discountCode : ', discountCode);
    console.log('paymentMethod : ', paymentMethod);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    if (!items.every((item: any) =>
      item?.productId &&
      item?.size &&
      item?.colorName &&
      item?.colorHex &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    )) {
      return res.status(400).json({ error: 'Each order item must include productId, size, colorName, colorHex, and a quantity greater than zero' });
    }

    const validPaymentMethods = ['card', 'applepay', 'googlepay'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid payment method is required' });
    }

    if (!customerInfo || !customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      return res.status(400).json({ error: 'Customer contact and shipping details are required' });
    }

    let subtotal = 0;
    const processedItems: any[] = [];

    // Verify stock and fetch prices for each item
    for (const orderItem of items) {
      const result = await query`SELECT * FROM products WHERE id = ${orderItem.productId}`;
      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Product with id ${orderItem.productId} not found` });
      }
      const product = result.rows[0];
      if (Number(product.stock) < orderItem.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}". Remaining: ${product.stock}` });
      }
      await query`UPDATE products SET stock = stock - ${orderItem.quantity} WHERE id = ${orderItem.productId}`;
      const lineTotal = Number(product.price) * orderItem.quantity;
      subtotal += lineTotal;
      processedItems.push({
        product: mapProductRow(product),
        selectedSize: orderItem.size,
        selectedColor: { name: orderItem.colorName, hex: orderItem.colorHex },
        quantity: orderItem.quantity,
      });
    }

    // Calculate discount
    let discountPercent = 0;
    if (discountCode) {
      const cleanCode = discountCode.trim().toUpperCase();
      if (cleanCode in VALID_DISCOUNTS) discountPercent = VALID_DISCOUNTS[cleanCode];
    }
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const shipping = 0;
    const total = subtotal - discountAmount + shipping;

    // Short order ID: 'ord' + 13-digit epoch = 16 chars (fits VARCHAR(20))
    const orderId = `ord${Date.now()}`;
    const discountCodeVal = discountCode || null;
    const discountAmountVal = discountAmount || 0;
    const now = new Date();

    // Card info
    const cardNumber = typeof card?.number === 'string' ? card.number.replace(/\s+/g, '') : '';
    const cardLast4 = cardNumber.slice(-4) || null;
    const cardBrand = cardNumber.startsWith('37') || cardNumber.startsWith('34') ? 'Amex'
      : cardNumber.startsWith('5') ? 'Mastercard'
        : cardNumber.startsWith('4') ? 'Visa'
          : 'Card';

    // ── INSERT into orders ──────────────────────────────────
    // Check if request has a valid user JWT (optional, guests don't have one)
    let orderUserId: number | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { id: number; email: string };
        orderUserId = decoded.id;
      } catch (_) {
        // token invalid — treat as guest
      }
    }

    await query`
      INSERT INTO orders
        (id, user_id, subtotal, shipping, discount_code, discount_amount, total,
         payment_method, card_brand, card_last4, status, created_at)
      VALUES
        (${orderId}, ${orderUserId}, ${subtotal}, ${shipping}, ${discountCodeVal}, ${discountAmountVal}, ${total},
         ${paymentMethod}, ${cardBrand}, ${cardLast4}, 'processing', ${now})
    `;

    // ── INSERT into order_customers ─────────────────────────
    await query`
      INSERT INTO order_customers
        (order_id, email, first_name, last_name, address, city, postal_code, country)
      VALUES
        (${orderId}, ${customerInfo.email}, ${customerInfo.firstName}, ${customerInfo.lastName},
         ${customerInfo.address || ''}, ${customerInfo.city || ''}, ${customerInfo.postalCode || ''}, ${customerInfo.country || ''})
    `;

    // ── INSERT into order_items (one row per cart line) ─────
    for (const item of processedItems) {
      const lineTotal = Number(item.product.price) * item.quantity;
      await query`
        INSERT INTO order_items
          (order_id, product_id, product_name, product_price, selected_size,
           color_name, color_hex, quantity, line_total)
        VALUES
          (${orderId}, ${item.product.id}, ${item.product.name}, ${item.product.price}, ${item.selectedSize},
           ${item.selectedColor.name}, ${item.selectedColor.hex}, ${item.quantity}, ${lineTotal})
      `;
    }

    const newOrder = {
      id: orderId,
      items: processedItems,
      customerInfo,
      subtotal,
      shipping,
      total,
      paymentMethod,
      date: now.toISOString(),
      discountCode: discountCode || undefined,
      discountAmount: discountAmount || undefined,
      status: 'processing',
      cardBrand,
      cardLast4,
    };

    if (newOrder.customerInfo?.email) {
      sendInvoiceEmail(newOrder).catch((err) => {
        console.error('[Email Trigger Error]', err);
      });
    }

    res.status(201).json(newOrder);
  } catch (err: any) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Database checkout transaction failed', detail: err.message });
  }
});

// GET /api/user/orders  — returns all orders for the logged-in user
app.get('/api/user/orders', authenticateUser as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Also look up the user's email so we can find guest orders placed with same email
    const userResult = await query`SELECT email FROM users WHERE id = ${userId}`;
    const userEmail = userResult.rows[0]?.email || '';

    const result = await query`
      SELECT
        o.id            AS order_id,
        o.subtotal, o.shipping, o.discount_code, o.discount_amount,
        o.total, o.payment_method, o.card_brand, o.card_last4, o.status, o.created_at,
        oc.email, oc.first_name, oc.last_name, oc.address, oc.city, oc.postal_code, oc.country, oc.mobile_number, oc.receipt_preference,
        oi.id           AS item_id,
        oi.product_id, oi.product_name, oi.product_price,
        oi.selected_size, oi.color_name, oi.color_hex, oi.quantity, oi.line_total,
        p.images        AS product_images
      FROM orders o
      LEFT JOIN order_customers oc ON oc.order_id = o.id
      LEFT JOIN order_items oi     ON oi.order_id = o.id
      LEFT JOIN products p         ON p.id = oi.product_id
      WHERE o.user_id = ${userId}
         OR (o.user_id IS NULL AND oc.email = ${userEmail})
      ORDER BY o.created_at DESC
    `;
    res.json(mapOrderRows(result.rows));
  } catch (err: any) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const result = await query`
      SELECT
        o.id            AS order_id,
        o.subtotal, o.shipping, o.discount_code, o.discount_amount,
        o.total, o.payment_method, o.card_brand, o.card_last4, o.status, o.created_at,
        oc.email, oc.first_name, oc.last_name, oc.address, oc.city, oc.postal_code, oc.country, oc.mobile_number, oc.receipt_preference,
        oi.id           AS item_id,
        oi.product_id, oi.product_name, oi.product_price,
        oi.selected_size, oi.color_name, oi.color_hex, oi.quantity, oi.line_total,
        p.images        AS product_images,
        p.category      AS product_category,
        p.description   AS product_description
      FROM orders o
      LEFT JOIN order_customers oc ON oc.order_id = o.id
      LEFT JOIN order_items oi     ON oi.order_id = o.id
      LEFT JOIN products p         ON p.id = oi.product_id
      WHERE o.id = ${req.params.id}
    `;
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const mapped = mapOrderRows(result.rows);
    res.json(mapped[0]);
  } catch (err: any) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Database query failed', detail: err.message });
  }
});

// GET /api/orders (Admin Only)
app.get('/api/orders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query`
      SELECT
        o.id            AS order_id,
        o.subtotal, o.shipping, o.discount_code, o.discount_amount,
        o.total, o.payment_method, o.card_brand, o.card_last4, o.status, o.created_at,
        oc.email, oc.first_name, oc.last_name, oc.address, oc.city, oc.postal_code, oc.country, oc.mobile_number, oc.receipt_preference,
        oi.id           AS item_id,
        oi.product_id, oi.product_name, oi.product_price,
        oi.selected_size, oi.color_name, oi.color_hex, oi.quantity, oi.line_total,
        p.images        AS product_images,
        p.category      AS product_category,
        p.description   AS product_description
      FROM orders o
      LEFT JOIN order_customers oc ON oc.order_id = o.id
      LEFT JOIN order_items oi     ON oi.order_id = o.id
      LEFT JOIN products p         ON p.id = oi.product_id
      ORDER BY o.created_at DESC
    `;
    const orders = mapOrderRows(result.rows);
    res.json(orders);
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Database query failed', detail: err.message });
  }
});

// PUT /api/orders/:id/status (Admin Only)
app.put('/api/orders/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const checkOrder = await query`SELECT id FROM orders WHERE id = ${req.params.id}`;
    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await query`UPDATE orders SET status = ${status} WHERE id = ${req.params.id}`;

    // Re-fetch via JOIN to return full order
    const updatedResult = await query`
      SELECT
        o.id            AS order_id,
        o.subtotal, o.shipping, o.discount_code, o.discount_amount,
        o.total, o.payment_method, o.card_brand, o.card_last4, o.status, o.created_at,
        oc.email, oc.first_name, oc.last_name, oc.address, oc.city, oc.postal_code, oc.country, oc.mobile_number, oc.receipt_preference,
        oi.id           AS item_id,
        oi.product_id, oi.product_name, oi.product_price,
        oi.selected_size, oi.color_name, oi.color_hex, oi.quantity, oi.line_total,
        p.images        AS product_images,
        p.category      AS product_category,
        p.description   AS product_description
      FROM orders o
      LEFT JOIN order_customers oc ON oc.order_id = o.id
      LEFT JOIN order_items oi     ON oi.order_id = o.id
      LEFT JOIN products p         ON p.id = oi.product_id
      WHERE o.id = ${req.params.id}
    `;
    const mapped = mapOrderRows(updatedResult.rows);
    res.json(mapped[0]);
  } catch (err: any) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Database update failed', detail: err.message });
  }
});

// DELETE /api/orders/:id (Admin Only)
app.delete('/api/orders/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const checkOrder = await query`SELECT id FROM orders WHERE id = ${req.params.id}`;
    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    // Delete child rows first (FK constraints), then the parent order
    await query`DELETE FROM order_items     WHERE order_id = ${req.params.id}`;
    await query`DELETE FROM order_customers WHERE order_id = ${req.params.id}`;
    await query`DELETE FROM orders          WHERE id       = ${req.params.id}`;
    res.status(204).end();
  } catch (err: any) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Database delete failed', detail: err.message });
  }
});

// ── 5. Newsletter subscription ───────────────────────────────────

// POST /api/newsletter/subscribe
app.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    await query`
      INSERT INTO subscribers (email)
      VALUES (${cleanEmail})
      ON CONFLICT (email) DO NOTHING
    `;

    res.json({ subscribed: true });
  } catch (err: any) {
    console.error('Error subscribing email:', err);
    res.status(500).json({ error: 'Database subscription failed' });
  }
});

// ── 6. Categories Endpoints ──────────────────────────────────────

// GET /api/categories (Public)
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const result = await query`SELECT id, label FROM categories ORDER BY created_at ASC`;
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Database query failed', detail: err.message });
  }
});

// POST /api/categories (Admin Only)
app.post('/api/categories', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id, label } = req.body;
    if (!id || !label) {
      return res.status(400).json({ error: 'Category id and label are required' });
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const cleanLabel = label.trim();

    if (!cleanId || !cleanLabel) {
      return res.status(400).json({ error: 'Category id and label cannot be empty' });
    }

    // Check for duplicate
    const existing = await query`SELECT id FROM categories WHERE id = ${cleanId}`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Category "${cleanId}" already exists` });
    }

    await query`INSERT INTO categories (id, label) VALUES (${cleanId}, ${cleanLabel})`;
    res.status(201).json({ id: cleanId, label: cleanLabel });
  } catch (err: any) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Database insert failed', detail: err.message });
  }
});

// DELETE /api/categories/:id (Admin Only)
app.delete('/api/categories/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const catId = req.params.id;

    // Block deletion if any products use this category
    const inUse = await query`SELECT COUNT(*) AS cnt FROM products WHERE category = ${catId}`;
    const count = Number(inUse.rows[0]?.cnt ?? 0);
    if (count > 0) {
      return res.status(400).json({ error: `Cannot delete: ${count} product(s) still use this category. Reassign them first.` });
    }

    const result = await query`DELETE FROM categories WHERE id = ${catId}`;
    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(204).end();
  } catch (err: any) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Database delete failed', detail: err.message });
  }
});

// ── 7. Users Management Endpoints (Admin Only) ───────────────────

// GET /api/admin/users
app.get('/api/admin/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query`SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC`;
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Database query failed', detail: err.message });
  }
});

// POST /api/admin/users
app.post('/api/admin/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields are required (firstName, lastName, email, password, role)' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email exists
    const existing = await query`SELECT id FROM users WHERE email = ${cleanEmail}`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await query`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES (${firstName.trim()}, ${lastName.trim()}, ${cleanEmail}, ${hash}, ${role})
      RETURNING id, first_name, last_name, email, role, created_at
    `;

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Database insert failed', detail: err.message });
  }
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields (firstName, lastName, email, role)' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email is taken by another user
    const existing = await query`SELECT id FROM users WHERE email = ${cleanEmail} AND id != ${userId}`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already used by another user' });
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await query`
        UPDATE users
        SET first_name = ${firstName.trim()}, last_name = ${lastName.trim()}, email = ${cleanEmail}, password_hash = ${hash}, role = ${role}
        WHERE id = ${userId}
      `;
    } else {
      await query`
        UPDATE users
        SET first_name = ${firstName.trim()}, last_name = ${lastName.trim()}, email = ${cleanEmail}, role = ${role}
        WHERE id = ${userId}
      `;
    }

    const updated = await query`SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ${userId}`;

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updated.rows[0]);
  } catch (err: any) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Database update failed', detail: err.message });
  }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await query`DELETE FROM users WHERE id = ${userId}`;
    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).end();
  } catch (err: any) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Database delete failed', detail: err.message });
  }
});

// ── 7. Forgot / Reset Password ──────────────────────────────────────────

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const userResult = await query`SELECT id FROM users WHERE email = ${cleanEmail}`;
    if (userResult.rows.length === 0) {
      // Don't leak that the email doesn't exist for security reasons, just pretend it worked
      return res.json({ success: true, message: 'If that email exists, a reset code was sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Expiry time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60000);

    // Upsert the OTP into password_resets table
    await query`
      INSERT INTO password_resets (email, otp, expires_at)
      VALUES (${cleanEmail}, ${otp}, ${expiresAt})
      ON CONFLICT (email) DO UPDATE
      SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at
    `;

    // Send email
    await sendPasswordResetEmail(cleanEmail, otp);

    res.json({ success: true, message: 'Password reset code sent successfully.' });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find the OTP record
    const otpResult = await query`SELECT otp, expires_at FROM password_resets WHERE email = ${cleanEmail}`;
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const record = otpResult.rows[0];
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    // Update the user's password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await query`UPDATE users SET password_hash = ${hash} WHERE email = ${cleanEmail}`;

    // Delete the used OTP
    await query`DELETE FROM password_resets WHERE email = ${cleanEmail}`;

    res.json({ success: true, message: 'Password has been successfully reset.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  DARVK NEON POSTGRES BACKEND RUNNING  `);
  console.log(`  URL: http://localhost:${PORT}                      `);
  console.log(`==================================================`);

  verifyEmailConfigOnStartup();
});
