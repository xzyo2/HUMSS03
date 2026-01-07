import mysql from 'mysql2/promise';

// Create a connection pool using environment variables
const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || 'test',
    port: process.env.TIDB_PORT || 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

export default async function handler(req, res) {
    try {
        // GET: Fetch all attendance records
        if (req.method === 'GET') {
            const [rows] = await pool.query('SELECT * FROM attendance_records ORDER BY date DESC, student_name ASC');
            return res.status(200).json(rows);
        }

        // POST: Add new records (Admin Only)
        if (req.method === 'POST') {
            const { records, password } = req.body;

            // Basic Security Check
            if (password !== '000secr_tary111') {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Loop through records and insert them
            // In a real app, we'd do a bulk insert, but a loop is fine for class size
            for (const rec of records) {
                await pool.execute(
                    'INSERT INTO attendance_records (student_name, date, status) VALUES (?, ?, ?)',
                    [rec.name, rec.date, rec.status]
                );
            }
            return res.status(200).json({ message: 'Success' });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database connection failed' });
    }
}