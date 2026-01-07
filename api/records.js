import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    port: process.env.TIDB_PORT || 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

export default async function handler(req, res) {
    const ADMIN_PASS = process.env.RECORDS_ADMIN_PASSWORD; 

    try {
        // GET: Fetch All Violations
        if (req.method === 'GET') {
            // We select ID now too so we can delete specific rows
            const [rows] = await pool.query('SELECT * FROM student_violations ORDER BY created_at DESC');
            return res.status(200).json(rows);
        }

        // POST: Add, Login, or DELETE
        if (req.method === 'POST') {
            const { action, student_name, reason, password, id } = req.body;

            // 1. Security Check
            if (password !== ADMIN_PASS) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // 2. Login Check
            if (action === 'login') {
                return res.status(200).json({ success: true });
            }

            // 3. Add Violation
            if (action === 'add' && student_name && reason) {
                await pool.execute(
                    'INSERT INTO student_violations (student_name, violation_reason) VALUES (?, ?)',
                    [student_name, reason]
                );
                return res.status(200).json({ message: 'Violation Added' });
            }

            // 4. DELETE VIOLATION (NEW)
            if (action === 'delete') {
                if (!id) return res.status(400).json({ error: 'ID required' });
                await pool.execute('DELETE FROM student_violations WHERE id = ?', [id]);
                return res.status(200).json({ message: 'Deleted' });
            }
        }

    } catch (error) {
        console.error("Records API Error:", error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
