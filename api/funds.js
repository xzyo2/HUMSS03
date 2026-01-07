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
    const TREASURER_PASS = process.env.TREASURER_PASSWORD;

    try {
        if (req.method === 'GET') {
            const page = parseInt(req.query.page) || 1;
            const limit = 15;
            const offset = (page - 1) * limit;

            const [rows] = await pool.query(
                'SELECT * FROM fund_transactions ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );

            const [balanceResult] = await pool.query(
                "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total FROM fund_transactions"
            );
            
            const total = balanceResult[0].total || 0;

            return res.status(200).json({ transactions: rows, total: total });
        }

        if (req.method === 'POST') {
            const { action, title, amount, type, date, password, id } = req.body;

            // 1. Security Check
            if (password !== TREASURER_PASS) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // 2. Login Check
            if (action === 'login') {
                return res.status(200).json({ success: true });
            }

            // 3. Delete Transaction (New)
            if (action === 'delete') {
                if (!id) return res.status(400).json({ error: 'ID required' });
                await pool.execute('DELETE FROM fund_transactions WHERE id = ?', [id]);
                return res.status(200).json({ message: 'Deleted' });
            }

            // 4. Save Transaction
            if (title && amount) {
                await pool.execute(
                    'INSERT INTO fund_transactions (title, amount, type, date) VALUES (?, ?, ?, ?)',
                    [title, amount, type, date]
                );
                return res.status(200).json({ message: 'Transaction Saved' });
            }
        }

    } catch (error) {
        console.error("Funds API Error:", error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
