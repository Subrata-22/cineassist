import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

console.log('DATABASE_URL =', process.env.DATABASE_URL);

pool.query('SELECT current_database()')
  .then(res => console.log('CONNECTED TO DB:', res.rows[0].current_database))
  .catch(console.error);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export default pool;
