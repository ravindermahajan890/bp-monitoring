const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bp_readings (
        id SERIAL PRIMARY KEY,
        recorded_at TIMESTAMP NOT NULL,
        systolic INTEGER NOT NULL CHECK (systolic > 0 AND systolic < 300),
        diastolic INTEGER NOT NULL CHECK (diastolic > 0 AND diastolic < 300),
        pulse INTEGER CHECK (pulse > 0 AND pulse < 300),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Add pulse column if table already existed without it
    await client.query(`
      ALTER TABLE bp_readings ADD COLUMN IF NOT EXISTS pulse INTEGER CHECK (pulse > 0 AND pulse < 300);
    `);
    console.log('✅ Migration complete – bp_readings table ready');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

