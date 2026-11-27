/**
 * migrate-images-to-blob.ts
 * One-time script to upload all existing product images (base64 or external URLs)
 * from PostgreSQL into your private Vercel Blob store and update `products.images`.
 *
 * Usage:
 *   1. Add BLOB_READ_WRITE_TOKEN=... to aura-premium-activewearBackEnd/.env
 *   2. Run: npm run migrate:blob
 */

import dotenv from 'dotenv';
import { put } from '@vercel/blob';
import { query, closePool } from './db.js';

dotenv.config();

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  const ext = MIME_TO_EXT[contentType] || 'jpg';
  return { buffer, contentType, ext };
}

async function fetchExternalImage(url: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim().toLowerCase();
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = MIME_TO_EXT[contentType] || 'jpg';
  return { buffer, contentType, ext };
}

async function migrate() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('ERROR: BLOB_READ_WRITE_TOKEN is missing in aura-premium-activewearBackEnd/.env');
    console.error('Copy it from Vercel -> Storage -> darvk-d8kf-blob -> .env.local tab.');
    process.exit(1);
  }

  const result = await query<{ id: string; name: string; images: string }>`
    SELECT id, name, images FROM products ORDER BY id ASC
  `;

  console.log(`Found ${result.rows.length} product(s) to check.`);
  let migratedCount = 0;

  for (const row of result.rows) {
    let images: string[] = [];
    try {
      images = JSON.parse(row.images || '[]');
    } catch {
      console.warn(`[Skip] ${row.id} (${row.name}): invalid images JSON`);
      continue;
    }

    let changed = false;
    const updatedImages: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img || img.startsWith('/api/blob/image')) {
        updatedImages.push(img);
        continue;
      }

      try {
        let payload: { buffer: Buffer; contentType: string; ext: string } | null = null;
        if (img.startsWith('data:image/')) {
          payload = parseDataUrl(img);
        } else if (img.startsWith('http://') || img.startsWith('https://')) {
          payload = await fetchExternalImage(img);
        }

        if (!payload) {
          console.warn(`[Skip] ${row.id} image #${i}: unsupported format`);
          updatedImages.push(img);
          continue;
        }

        const blob = await put(`products/${row.id}-${i}.${payload.ext}`, payload.buffer, {
          access: 'private',
          contentType: payload.contentType,
          addRandomSuffix: true,
        });

        updatedImages.push(`/api/blob/image?url=${encodeURIComponent(blob.url)}`);
        changed = true;
        migratedCount++;
        console.log(`[Uploaded] ${row.id} (${row.name}) image #${i} -> ${blob.pathname}`);
      } catch (err: any) {
        console.error(`[Error] ${row.id} image #${i}:`, err?.message || err);
        updatedImages.push(img);
      }
    }

    if (changed) {
      await query`UPDATE products SET images = ${JSON.stringify(updatedImages)} WHERE id = ${row.id}`;
      console.log(`[Updated DB] ${row.id} (${row.name})`);
    }
  }

  console.log(`\nDone! Uploaded ${migratedCount} image(s) to Vercel Blob.`);
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
