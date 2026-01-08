import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.TIDB_HOST,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || 'test', 
    port: process.env.TIDB_PORT || 4000,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

export default async function handler(req, res) {
    const REC_PASS = process.env.RECORDS_ADMIN_PASSWORD;
    const OP_PASS = process.env.OPERATOR_PASSWORD;

    try {
        if (req.method === 'GET') {
            // Check if table exists first to avoid crash
            const [rows] = await pool.query('SELECT * FROM student_violations ORDER BY created_at DESC');
            return res.status(200).json(rows);
        }

        if (req.method === 'POST') {
            const { action, student_name, reason, password, id } = req.body;
            if (password !== REC_PASS && password !== OP_PASS) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (action === 'login') return res.status(200).json({ success: true });

            if (action === 'add') {
                if (!student_name || !reason) return res.status(400).json({ error: "Missing fields" });
                
                await pool.execute(
                    'INSERT INTO student_violations (student_name, violation_reason) VALUES (?, ?)',
                    [student_name, reason]
                );
                return res.status(200).json({ message: 'Violation Added' });
            }

            if (action === 'delete') {
                if (!id) return res.status(400).json({ error: 'ID required' });
                await pool.execute('DELETE FROM student_violations WHERE id = ?', [id]);
                return res.status(200).json({ message: 'Deleted' });
            }
        }
    } catch (error) {
        console.error("Records API Error:", error);
        return res.status(500).json({ error: error.message || 'Database Error' });
    }
}
