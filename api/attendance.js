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
    const ADMIN_PASS = process.env.ADMIN_PASSWORD;

    try {
        if (req.method === 'GET') {
            const [rows] = await pool.query('SELECT * FROM attendance_records ORDER BY date DESC, student_name ASC');
            return res.status(200).json(rows);
        }

        if (req.method === 'POST') {
            const { action, records, password, date } = req.body;

            // 1. Security Check
            if (password !== ADMIN_PASS) {
                return res.status(401).json({ error: 'Wrong Password' });
            }

            // 2. Login Check
            if (action === 'login') {
                return res.status(200).json({ success: true });
            }

            // 3. Delete Logic (Wipe a date)
            if (action === 'delete') {
                if (!date) return res.status(400).json({ error: 'Date required' });
                await pool.execute('DELETE FROM attendance_records WHERE date = ?', [date]);
                return res.status(200).json({ message: 'Deleted' });
            }

            // 4. Save Logic (Overwrite/Edit)
            if (action === 'save' && records && records.length > 0) {
                // Step A: Wipe existing data for this date to prevent duplicates
                const targetDate = records[0].date;
                await pool.execute('DELETE FROM attendance_records WHERE date = ?', [targetDate]);

                // Step B: Insert new data
                for (const rec of records) {
                    await pool.execute(
                        'INSERT INTO attendance_records (student_name, date, status) VALUES (?, ?, ?)',
                        [rec.name, rec.date, rec.status]
                    );
                }
                return res.status(200).json({ message: 'Saved' });
            }
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server Error' });
    }
}
