import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Read and cache the logo buffer once at startup
let _logoBuffer: Buffer | null = null;
function getLogoBuffer(): Buffer | null {
  if (!_logoBuffer) {
    try {
      const pngPath = path.join(__dirname, 'logo.png');
      if (fs.existsSync(pngPath)) {
        _logoBuffer = fs.readFileSync(pngPath);
      } else {
        const b64Path = path.join(__dirname, 'logo_b64.txt');
        if (fs.existsSync(b64Path)) {
          const b64 = fs.readFileSync(b64Path, 'utf8').trim();
          _logoBuffer = Buffer.from(b64, 'base64');
        }
      }
    } catch (err) {
      console.error('[Email Service] Failed to read logo buffer:', err);
    }
  }
  return _logoBuffer;
}

function getLogoDataUri(): string {
  const buf = getLogoBuffer();
  return buf ? `data:image/png;base64,${buf.toString('base64')}` : '';
}

export interface OrderItem {
  id?: number | string;
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
  };
  selectedSize: string;
  selectedColor: {
    name: string;
    hex: string;
  };
  quantity: number;
}

export interface OrderCustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderDetails {
  id: string;
  items: OrderItem[];
  customerInfo: OrderCustomerInfo;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  date: string;
  discountCode?: string;
  discountAmount?: number;
  cardBrand?: string;
  cardLast4?: string;
}

/**
 * Renders the HTML template for the invoice.
 */
function renderInvoiceHtml(order: OrderDetails): string {
  const dateStr = new Date(order.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const formattedSubtotal = currencyFormatter.format(order.subtotal);
  const formattedShipping = order.shipping === 0 ? 'FREE' : currencyFormatter.format(order.shipping);
  const formattedTotal = currencyFormatter.format(order.total);

  const discountRow = order.discountAmount && order.discountAmount > 0
    ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Discount (${order.discountCode || 'Promo'}):</td>
        <td style="padding: 8px 0; text-align: right; color: #dc2626; font-size: 14px; font-weight: 500;">-${currencyFormatter.format(order.discountAmount)}</td>
      </tr>`
    : '';

  const itemsRows = order.items.map(item => {
    const lineTotal = item.product.price * item.quantity;
    return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 16px 0; vertical-align: top;">
          <div style="font-weight: 600; color: #111827; font-size: 14px; text-transform: uppercase;">
            ${item.product.name}
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px; display: flex; align-items: center;">
            <span style="margin-right: 12px;">SIZE: <strong>${item.selectedSize}</strong></span>
            <span style="display: inline-flex; align-items: center;">
              COLOR: 
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${item.selectedColor.hex}; margin: 0 4px; border: 1px solid #e5e7eb;"></span>
              <strong>${item.selectedColor.name.toUpperCase()}</strong>
            </span>
          </div>
        </td>
        <td style="padding: 16px 0; text-align: center; color: #4b5563; font-size: 14px; vertical-align: top;">
          ${item.quantity}
        </td>
        <td style="padding: 16px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 500; vertical-align: top;">
          ${currencyFormatter.format(item.product.price)}
        </td>
        <td style="padding: 16px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600; vertical-align: top;">
          ${currencyFormatter.format(lineTotal)}
        </td>
      </tr>
    `;
  }).join('');

  const paymentMethodLabel = order.paymentMethod === 'card'
    ? `Credit Card (${order.cardBrand || 'Card'} ending in ${order.cardLast4 || '****'})`
    : order.paymentMethod === 'applepay'
      ? 'Apple Pay'
      : order.paymentMethod === 'googlepay'
        ? 'Google Pay'
        : order.paymentMethod.toUpperCase();

  const logoBuffer = getLogoBuffer();
  const logoHtml = logoBuffer
    ? `<img src="cid:darvk-logo" alt="DARVK Premium Activewear" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;" />`
    : `<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; font-family: 'Outfit', -apple-system, sans-serif; letter-spacing: 0.25em;">DARVK<span style="color: #dc2626;">.</span></h1>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your DARVK Premium Activewear Invoice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" max-width="600px" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #f3f4f6;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #050505; padding: 28px 40px; text-align: center;">
              <!-- Brand Logo Image (Base64 embedded — works in all email clients) -->
              ${logoHtml}
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase;">Premium Activewear</p>
            </td>
          </tr>

          <!-- Thank You Message -->
          <tr>
            <td style="padding: 40px 40px 24px 40px;">
              <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">Thank you for your order!</h2>
              <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 14px; line-height: 1.5;">We are preparing your package. A summary of your transaction details is listed below. You will receive a tracking link as soon as your activewear is on its way.</p>
            </td>
          </tr>

          <!-- Invoice Metadata -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 16px 0;">
                <tr>
                  <td style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                    Order Number:<br>
                    <span style="font-weight: 600; color: #111827; font-size: 14px;">${order.id}</span>
                  </td>
                  <td style="font-size: 13px; color: #6b7280; line-height: 1.6; text-align: right;">
                    Date Placed:<br>
                    <span style="font-weight: 600; color: #111827; font-size: 14px;">${dateStr}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Info & Shipping -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 20px;">
                    <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Shipping Details</h3>
                    <div style="font-size: 13px; color: #4b5563; line-height: 1.6;">
                      <strong>${order.customerInfo.firstName} ${order.customerInfo.lastName}</strong><br>
                      ${order.customerInfo.address}<br>
                      ${order.customerInfo.city}, ${order.customerInfo.postalCode}<br>
                      ${order.customerInfo.country}
                    </div>
                  </td>
                  <td width="50%" style="vertical-align: top;">
                    <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Payment Details</h3>
                    <div style="font-size: 13px; color: #4b5563; line-height: 1.6;">
                      Method: <strong>${paymentMethodLabel}</strong><br>
                      Email: <strong>${order.customerInfo.email}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items Table -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #e5e7eb;">
                    <th align="left" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Product</th>
                    <th align="center" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; width: 60px;">Qty</th>
                    <th align="right" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; width: 80px;">Price</th>
                    <th align="right" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; width: 90px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals Section -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
              <table align="right" width="260px" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 500;">${formattedSubtotal}</td>
                </tr>
                ${discountRow}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Shipping:</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 500;">${formattedShipping}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                  <td style="padding: 16px 0 0 0; color: #111827; font-size: 16px; font-weight: 700;">Total Paid:</td>
                  <td style="padding: 16px 0 0 0; text-align: right; color: #000000; font-size: 20px; font-weight: 800;">${formattedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">If you have any questions or feedback regarding this invoice or your order, please do not hesitate to contact our customer support team at <a href="mailto:support@aurapremium.com" style="color: #6b7280; text-decoration: underline; font-weight: 500;">support@aurapremium.com</a>.</p>
              <p style="margin: 12px 0 0 0; color: #cbd5e1; font-size: 11px;">&copy; ${new Date().getFullYear()} AURA Premium Activewear. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends a premium invoice e-mail using nodemailer.
 * If SMTP configurations are not fully set, it safely falls back to console logging.
 */
export async function sendInvoiceEmail(order: OrderDetails): Promise<void> {
  const recipient = order.customerInfo?.email;
  if (!recipient) {
    console.log(`[Email Service] No recipient email specified for order ${order.id}. Skipping invoice email.`);
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '2525');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@aurapremium.com';

  const isSmtpConfigured = !!(smtpHost && smtpUser && smtpPass);

  const htmlContent = renderInvoiceHtml(order);

  const logoBuffer = getLogoBuffer();
  const attachments = logoBuffer ? [{
    filename: 'logo.png',
    content: logoBuffer,
    cid: 'darvk-logo'
  }] : [];

  if (!isSmtpConfigured) {
    const missing = [
      !smtpHost && 'SMTP_HOST',
      !smtpUser && 'SMTP_USER',
      !smtpPass && 'SMTP_PASS',
    ].filter(Boolean).join(', ');

    const previewPath = path.join(process.cwd(), 'last_invoice_preview.html');
    try {
      const previewHtml = htmlContent.replace('cid:darvk-logo', getLogoDataUri());
      fs.writeFileSync(previewPath, previewHtml, 'utf8');
    } catch (writeErr: any) {
      console.error(`[Email Service] Failed to save local preview file: ${writeErr.message}`);
    }

    console.warn('\n========================================================================');
    console.warn(`[Email Service] ⚠️  NOT SENDING A REAL EMAIL — missing .env value(s): ${missing}`);
    console.warn(`[Email Service] The customer at ${recipient} will NOT receive anything.`);
    console.warn(`[Email Service] Falling back to a Ethereal sandbox preview (only visible to you).`);
    console.warn('========================================================================\n');

    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"DARVK Premium Activewear" <${smtpFrom}>`,
        to: recipient,
        subject: `Your DARVK Premium Activewear Invoice (Order #${order.id}) [TEST SANDBOX]`,
        html: htmlContent,
        attachments,
      });

      const etherealUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email Service] Sandbox preview (NOT delivered to ${recipient}): ${etherealUrl}`);
      return;
    } catch (etherealErr: any) {
      console.error(`[Email Service] Even the Ethereal sandbox failed to load: ${etherealErr.message}`);
      const previewPath = path.join(process.cwd(), 'last_invoice_preview.html');
      console.log(`[Email Service] Invoice HTML saved locally instead: ${previewPath}`);
      return;
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports (e.g. 587 uses STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"DARVK Premium Activewear" <${smtpFrom}>`,
      to: recipient,
      subject: `Your DARVK Premium Activewear Invoice (Order #${order.id})`,
      html: htmlContent,
      attachments,
    });

    console.log(`[Email Service] ✅ Invoice email sent to ${recipient}: ${info.messageId}`);
  } catch (error: any) {
    console.error(`[Email Service] ❌ Failed to send invoice email for order ${order.id}: ${error.message}`);
    if (error.code) console.error(`[Email Service]    error code: ${error.code}`);
    if (error.response) console.error(`[Email Service]    server response: ${error.response}`);
  }
}

/**
 * Verifies the SMTP connection at server startup so misconfiguration shows
 * up immediately in the boot logs instead of silently failing on the first
 * real order. Safe to call even if SMTP isn't configured — it just logs
 * a clear warning instead of throwing.
 */
export async function verifyEmailConfigOnStartup(): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '2525');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[Email Service] SMTP not configured — order emails will use the Ethereal sandbox, not real inboxes.');
    console.warn('[Email Service] Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env to send real emails.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.verify();
    console.log(`[Email Service] ✅ SMTP connection verified (${smtpHost}:${smtpPort} as ${smtpUser}) — ready to send real emails.`);
  } catch (err: any) {
    console.error(`[Email Service] ❌ SMTP credentials are set but the connection FAILED: ${err.message}`);
    console.error('[Email Service]    Real emails will NOT send until this is fixed. Common causes:');
    console.error('[Email Service]    - Gmail: you must use a 16-character App Password, not your normal password');
    console.error('[Email Service]    - Gmail: 2-Step Verification must be enabled on the account first');
    console.error('[Email Service]    - Wrong SMTP_PORT (587 for STARTTLS, 465 for implicit TLS)');
  }
}

/**
 * Sends a password reset OTP email.
 */
export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('[Email Service] SMTP is not configured. Cannot send password reset email.');
    throw new Error('Email service is not configured');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
  const logoBuffer = getLogoBuffer();
  const logoHtml = logoBuffer
    ? `<img src="cid:darvk-logo" alt="DARVK Logo" style="display: block; margin: 0 auto; width: 140px; height: auto;" />`
    : `<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 4px;">DARVK</h1>`;

  const attachments: any[] = [];
  if (logoBuffer) {
    attachments.push({
      filename: 'logo.png',
      content: logoBuffer,
      cid: 'darvk-logo',
    });
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #050505; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #1f1f1f; }
        .header { background-color: #000000; padding: 40px 20px; text-align: center; border-bottom: 2px solid #ef4444; }
        .content { padding: 40px 30px; text-align: center; }
        .otp { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ef4444; background-color: #1a1a1a; padding: 20px; display: inline-block; border-radius: 4px; margin: 20px 0; border: 1px solid #333; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #1f1f1f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoHtml}
        </div>
        <div class="content">
          <h2 style="margin-top: 0; text-transform: uppercase; letter-spacing: 2px;">Password Reset Request</h2>
          <p style="color: #999; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your DARVK account. Enter the following 6-digit code to continue:</p>
          
          <div class="otp">${otp}</div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">This code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} DARVK. All rights reserved.<br>
          Engineered to Outwork. Designed to Stand Out.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"DARVK Store" <${process.env.SMTP_USER || 'noreply@darvk.com'}>`,
      to: email,
      subject: 'DARVK - Password Reset Code',
      text: `Your password reset code is: ${otp}`,
      html: htmlBody,
      attachments,
    });
    console.log(`[Email Service] ✅ Password reset email sent to ${email}: ${info.messageId}`);
  } catch (err: any) {
    console.error(`[Email Service] ❌ Failed to send password reset email to ${email}: ${err.message}`);
    throw err;
  }
}

