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
    try {
        const currentYear = new Date().getFullYear();

        if (req.method === 'GET') {
            const { name } = req.query;
            const [rows] = await pool.query(
                'SELECT wish_id, count FROM birthday_wishes WHERE student_name = ? AND wish_year = ?',
                [name, currentYear]
            );
            return res.status(200).json(rows);
        }

        if (req.method === 'POST') {
            const { name, wishId } = req.body;
            

            await pool.execute(
                `INSERT INTO birthday_wishes (student_name, wish_id, count, wish_year) 
                 VALUES (?, ?, 1, ?) 
                 ON DUPLICATE KEY UPDATE count = count + 1`,
                [name, wishId, currentYear]
            );
            
            // Return new count
            const [rows] = await pool.query(
                'SELECT count FROM birthday_wishes WHERE student_name = ? AND wish_id = ? AND wish_year = ?',
                [name, wishId, currentYear]
            );
            
            return res.status(200).json({ newCount: rows[0]?.count || 1 });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Database Error' });
    }
}
