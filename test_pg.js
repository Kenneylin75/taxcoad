const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://temple_user:test@127.0.0.1:5432/temple_db'
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows[0]);
  pool.end();
});
