import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DBHOST || 'localhost',
    user: process.env.DBUSER || 'root',
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function addOrderIntoDatabase(type, price, qty, shareName, userID) {
    const query = `INSERT INTO orders (type, price, qty, shareName, userID) VALUES (?, ?, ?, ?, ?)`;
    const values = [type, price, qty, shareName, userID];
    try {
        const [result] = await pool.execute(query, values);
        // console.log('Added Successfully');
        return result;
    } catch (err) {
        console.error('addOrderIntoDatabase error:', err);
        throw err;
    }
}

export async function addMatchedOrderIntoDatabase(price, qty, shareName, buyID, sellID) {
    const query = `INSERT INTO MatchedOrders (matchedprice, qty, shareName, buyID, sellID) VALUES (?, ?, ?, ?, ?)`;
    const values = [price, qty, shareName, buyID, sellID];
    try {
        const [result] = await pool.execute(query, values);
        // console.log('Matched Successfully');
        return result;
    } catch (err) {
        console.error('addMatchedOrderIntoDatabase error:', err);
        throw err;
    }
}