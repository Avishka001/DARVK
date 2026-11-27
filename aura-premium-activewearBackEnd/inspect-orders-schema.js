import { query, closePool } from './db.js';

(async () => {
  try {
    const res = await query`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `;
    console.log(JSON.stringify(res.rows, null, 2));
    await closePool();
  } catch (err) {
    console.error(err);
    await closePool().catch(() => {});
    process.exit(1);
  }
})();
