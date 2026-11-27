/**
 * setup-db.ts
 * Run once with:  npm run setup
 *
 * Connects to Neon PostgreSQL via DATABASE_URL,
 * creates all tables, and seeds the initial product catalogue.
 */

import dotenv from 'dotenv';
import { query, closePool } from './db.js';
import { ensureTables } from './schema.js';

dotenv.config();

const SEED_PRODUCTS = [
  {
    id: 'prod-01',
    name: 'Apex Performance Seamless Tee',
    price: 48,
    originalPrice: 58,
    category: 'tops',
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800',
    ],
    description:
      'Engineered for high-intensity training. Advanced seamless knit technology eliminates friction, featuring zonal breathability and high-grade moisture-wicking fibers.',
    features: [
      '4-way stretch compression knit',
      'Anti-odor silver-ion treatment',
      'Hyper-ventilating honeycomb zones',
      'Ergonomic flatlock side panels',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Obsidian Black', hex: '#111827' },
      { name: 'Slate Blue', hex: '#3b82f6' },
    ],
    isNew: true,
    isBestSeller: true,
    stock: 25,
  },
  {
    id: 'prod-02',
    name: 'Darvk V2 Oversized Hoodie',
    price: 84,
    originalPrice: null,
    category: 'outerwear',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800',
    ],
    description:
      'Crafted from 460GSM ultra-dense organic French Terry cotton. Features dropped shoulders, a double-lined structured hood, and custom branded chest embroidery.',
    features: [
      '460GSM heavyweight French Terry cotton',
      'Structured double-lined drawstring-free hood',
      'Pre-shrunk premium combed fibers',
      'Hidden zipper side pockets for secure storage',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Vintage Charcoal', hex: '#374151' },
      { name: 'Desert Sand', hex: '#d1b894' },
    ],
    isNew: true,
    isBestSeller: false,
    stock: 15,
  },
  {
    id: 'prod-03',
    name: 'Pursuit Utility Workout Joggers',
    price: 68,
    originalPrice: null,
    category: 'bottoms',
    images: [
      'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
    ],
    description:
      'High-performance tailored active sweatpants made from a highly flexible nylon-elastane matrix. Water-repellent, lightweight, with tapered silhouette design.',
    features: [
      'Water-resistant DWR shield finish',
      'Reflective thermal decals for safety',
      'Ankle cuff zippers for variable style',
      'Dual secure zip cargo pockets',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Carbon Grey', hex: '#4b5563' },
      { name: 'Stealth Black', hex: '#111827' },
    ],
    isNew: false,
    isBestSeller: true,
    stock: 30,
  },
  {
    id: 'prod-04',
    name: 'Contour High-Waisted Leggings',
    price: 62,
    originalPrice: null,
    category: 'bottoms',
    images: [
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=800',
    ],
    description:
      'Body-sculpting, high-support seamless active leggings. Designed with core-stabilizing high waistbands, glute-contouring weaves, and a reliable squat-proof density.',
    features: [
      '100% squat-proof interlock weave density',
      'No-slip ribbed supportive waistband',
      'Incredibly soft breathable fabric blend',
      'Gusseted crotch structure for maximum flexibility',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Sage Green', hex: '#86efac' },
      { name: 'Deep Black', hex: '#0a0a0a' },
    ],
    isNew: true,
    isBestSeller: true,
    stock: 18,
  },
  {
    id: 'prod-05',
    name: 'Elite Droptail Muscle Tank',
    price: 36,
    originalPrice: null,
    category: 'tops',
    images: [
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
    ],
    description:
      'Designed for optimal range of motion. Deep cut-out shoulders and custom droptail hem emphasize an athletic form while providing complete comfort.',
    features: [
      'Deep-cut racerback construction',
      'Dropped curved rear hemline coverage',
      'Featherlight micro-stretch cooling fibers',
      'Abrasion-free flat seams for training comfort',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Crimson Red', hex: '#ef4444' },
      { name: 'Stealth Black', hex: '#111827' },
    ],
    isNew: false,
    isBestSeller: true,
    stock: 40,
  },
  {
    id: 'prod-06',
    name: 'DARVK Heavy-Duty Shaker & Bottle',
    price: 24,
    originalPrice: null,
    category: 'accessories',
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?auto=format&fit=crop&q=80&w=800',
    ],
    description:
      'Double-walled insulated stainless steel training shaker. Keeps hydration ice-cold for 24 hours, featuring leak-proof heavy duty latch locking and custom powder coat finishing.',
    features: [
      'Double-walled 18/8 food-grade stainless steel',
      'Vacuum insulated (keeps beverages cold for 24h)',
      '100% leakproof mechanical lid locks',
      'Aggressive tactile powder coating finish',
    ],
    sizes: ['O/S'],
    colors: [
      { name: 'Matte Black', hex: '#111827' },
      { name: 'Raw Steel', hex: '#9ca3af' },
    ],
    isNew: false,
    isBestSeller: false,
    stock: 50,
  },
];

async function seedProducts() {
  for (const p of SEED_PRODUCTS) {
    const existing = await query`SELECT id FROM products WHERE id = ${p.id}`;
    if (existing.rows.length > 0) {
      console.log(`[Seed] Product "${p.name}" already exists, skipping.`);
      continue;
    }

    await query`
      INSERT INTO products
        (id, name, price, original_price, category, images, description, features, sizes, colors, is_new, is_best_seller, stock, gender)
      VALUES
        (${p.id}, ${p.name}, ${p.price}, ${p.originalPrice}, ${p.category},
         ${JSON.stringify(p.images)}, ${p.description}, ${JSON.stringify(p.features)},
         ${JSON.stringify(p.sizes)}, ${JSON.stringify(p.colors)},
         ${Boolean(p.isNew)}, ${Boolean(p.isBestSeller)}, ${p.stock}, ${(p as any).gender || 'unisex'})
    `;
    console.log(`[Seed] Inserted product: ${p.name}`);
  }
}

async function run() {
  try {
    console.log('\n====================================');
    console.log('  DARVK STORE — Neon DB Setup');
    console.log('====================================\n');

    await ensureTables();
    console.log('[Setup] All PostgreSQL tables ready.');

    await seedProducts();

    await closePool();
    console.log('\nSetup complete! Run "npm run dev" to start the backend.');
  } catch (err: any) {
    console.error('\nSetup failed:', err.message || err);
    console.error('\nMake sure your .env file has a valid Neon DATABASE_URL.');
    await closePool().catch(() => {});
    process.exit(1);
  }
}

run();
