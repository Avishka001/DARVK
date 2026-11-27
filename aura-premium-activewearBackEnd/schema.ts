import { query } from './db.js';

/**
 * Ensures all required PostgreSQL tables, columns, and default categories exist in Neon.
 */
export async function ensureTables(): Promise<void> {
  // ── products ──────────────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS products (
      id             VARCHAR(50)      PRIMARY KEY,
      name           VARCHAR(255)     NOT NULL,
      price          DOUBLE PRECISION NOT NULL,
      original_price DOUBLE PRECISION NULL,
      category       VARCHAR(50)      NOT NULL,
      images         TEXT             NOT NULL DEFAULT '[]',
      description    TEXT             NOT NULL DEFAULT '',
      features       TEXT             NOT NULL DEFAULT '[]',
      sizes          TEXT             NOT NULL DEFAULT '[]',
      colors         TEXT             NOT NULL DEFAULT '[]',
      is_new         BOOLEAN          NOT NULL DEFAULT FALSE,
      is_best_seller BOOLEAN          NOT NULL DEFAULT FALSE,
      stock          INTEGER          NOT NULL DEFAULT 0,
      gender         VARCHAR(20)      NOT NULL DEFAULT 'unisex'
    )
  `;

  // ── users ─────────────────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL       PRIMARY KEY,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      first_name    VARCHAR(100) NULL,
      last_name     VARCHAR(100) NULL,
      google_id     VARCHAR(255) NULL,
      role          INTEGER      NOT NULL DEFAULT 2,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  // ── password_resets ───────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS password_resets (
      email      VARCHAR(255) PRIMARY KEY,
      otp        VARCHAR(6)   NOT NULL,
      expires_at TIMESTAMPTZ  NOT NULL
    )
  `;

  // ── orders ────────────────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS orders (
      id              VARCHAR(20)    PRIMARY KEY,
      user_id         INTEGER        NULL,
      subtotal        NUMERIC(10,2)  NOT NULL DEFAULT 0,
      shipping        NUMERIC(10,2)  NOT NULL DEFAULT 0,
      discount_code   VARCHAR(50)    NULL,
      discount_amount NUMERIC(10,2)  NOT NULL DEFAULT 0,
      total           NUMERIC(10,2)  NOT NULL DEFAULT 0,
      payment_method  VARCHAR(20)    NOT NULL DEFAULT 'card',
      card_brand      VARCHAR(20)    NULL,
      card_last4      VARCHAR(4)     NULL,
      status          VARCHAR(20)    NOT NULL DEFAULT 'processing',
      created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    )
  `;
  await query`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER NULL`;

  // ── order_customers ───────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS order_customers (
      id                 SERIAL       PRIMARY KEY,
      order_id           VARCHAR(20)  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      email              VARCHAR(255) NOT NULL,
      first_name         VARCHAR(100) NOT NULL,
      last_name          VARCHAR(100) NOT NULL,
      address            VARCHAR(255) NOT NULL DEFAULT '',
      city               VARCHAR(100) NOT NULL DEFAULT '',
      postal_code        VARCHAR(20)  NOT NULL DEFAULT '',
      country            VARCHAR(100) NOT NULL DEFAULT '',
      mobile_number      VARCHAR(20)  NULL,
      receipt_preference VARCHAR(20)  NOT NULL DEFAULT 'email'
    )
  `;
  await query`ALTER TABLE order_customers ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) NULL`;
  await query`ALTER TABLE order_customers ADD COLUMN IF NOT EXISTS receipt_preference VARCHAR(20) NOT NULL DEFAULT 'email'`;

  // ── order_items ───────────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS order_items (
      id            SERIAL        PRIMARY KEY,
      order_id      VARCHAR(20)   NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id    VARCHAR(50)   NOT NULL,
      product_name  VARCHAR(255)  NOT NULL,
      product_price NUMERIC(10,2) NOT NULL,
      selected_size VARCHAR(20)   NOT NULL,
      color_name    VARCHAR(100)  NOT NULL,
      color_hex     VARCHAR(10)   NOT NULL,
      quantity      INTEGER       NOT NULL DEFAULT 1,
      line_total    NUMERIC(10,2) NOT NULL
    )
  `;

  // ── subscribers ───────────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS subscribers (
      id    SERIAL       PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE
    )
  `;

  // ── categories ────────────────────────────────────────────
  await query`
    CREATE TABLE IF NOT EXISTS categories (
      id         VARCHAR(50)  PRIMARY KEY,
      label      VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  const defaultCats: [string, string][] = [
    ['tops', 'Tops'],
    ['bottoms', 'Bottoms'],
    ['outerwear', 'Outerwear'],
    ['accessories', 'Accessories'],
  ];

  for (const [id, label] of defaultCats) {
    await query`
      INSERT INTO categories (id, label)
      VALUES (${id}, ${label})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}
