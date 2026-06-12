import { query } from './src/config/database.js';

await query(`
  INSERT INTO challenges (title, description, theme, focus_module, start_date, end_date, is_active)
  VALUES (
    'Rule of Thirds Challenge',
    'Submit your best shot using the rule of thirds. Place your subject on a grid intersection!',
    'Composition',
    'Rule of Thirds',
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  )
`);
console.log('Challenge saved!');

const result = await query('SELECT title, is_active FROM challenges');
console.log('All challenges:', result.rows);

process.exit();