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
    const TREAS_PASS = process.env.TREASURER_PASSWORD;
    const OP_PASS = process.env.OPERATOR_PASSWORD; 

    try {
        if (req.method === 'GET') {
            const page = parseInt(req.query.page) || 1;
            const limit = 15;
            const offset = (page - 1) * limit;

            const [transactions] = await pool.query('SELECT * FROM fund_transactions ORDER BY date DESC, id DESC LIMIT ? OFFSET ?', [limit, offset]);
            const [totalRow] = await pool.query('SELECT SUM(CASE WHEN type="income" THEN amount ELSE -amount END) as total FROM fund_transactions');
            
            return res.status(200).json({
                transactions,
                total: totalRow[0].total || 0
            });
        }

        if (req.method === 'POST') {
            const { action, title, amount, type, date, password, id } = req.body;

            if (password !== TREAS_PASS && password !== OP_PASS) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (action === 'login') return res.status(200).json({ success: true });

            if (action === 'delete') {
                if(!id) return res.status(400).json({ error: 'ID Required' });
                await pool.execute('DELETE FROM fund_transactions WHERE id = ?', [id]);
                return res.status(200).json({ message: 'Deleted' });
            }

            if (title && amount && type && date) {
                await pool.execute(
                    'INSERT INTO fund_transactions (title, amount, type, date) VALUES (?, ?, ?, ?)',
                    [title, amount, type, date]
                );
                return res.status(200).json({ message: 'Saved' });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
