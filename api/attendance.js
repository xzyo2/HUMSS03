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
    const SEC_PASS = process.env.SECRETARY_PASSWORD;
    const OP_PASS = process.env.OPERATOR_PASSWORD; 

    try {
        if (req.method === 'GET') {
            const [rows] = await pool.query('SELECT * FROM student_attendance');
            return res.status(200).json(rows);
        }

        if (req.method === 'POST') {
            const { action, records, date, password } = req.body;
            if (password !== SEC_PASS && password !== OP_PASS) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (action === 'login') return res.status(200).json({ success: true });

            if (action === 'save') {
                const connection = await pool.getConnection();
                try {
                    await connection.beginTransaction();
                    await connection.execute('DELETE FROM student_attendance WHERE date = ?', [date]);
                    for (const rec of records) {
                        await connection.execute(
                            'INSERT INTO student_attendance (student_name, date, status) VALUES (?, ?, ?)',
                            [rec.name, rec.date, rec.status]
                        );
                    }
                    await connection.commit();
                    return res.status(200).json({ message: 'Saved' });
                } catch (err) {
                    await connection.rollback();
                    throw err;
                } finally {
                    connection.release();
                }
            }

            if (action === 'delete') {
                await pool.execute('DELETE FROM student_attendance WHERE date = ?', [date]);
                return res.status(200).json({ message: 'Deleted' });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
