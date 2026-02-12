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