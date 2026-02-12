import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:process.env.DBPASS,
    database:process.env.DBNAME
});

connection.connect((err)=>{
    if (err){
        console.log(err);
        return;
    }
    console.log("Connected");
});

export async function addOrderIntoDatabase(type,price,qty,shareName,userID){
    const query = `Insert into orders (type, price, qty, shareName, userID) values (?, ?, ?, ?, ?)`;
    const values = [type,price,qty,shareName,userID];
    connection.query(query, values, function(err,result){
        if (err) throw err;
        console.log("Added Sucessfully");
    });
};