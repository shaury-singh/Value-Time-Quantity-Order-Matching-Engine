import mysql from 'mysql2';

const connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"Dairymil1@",
    database:"test-exchange"
});

connection.connect((err)=>{
    if (err){
        console.log(err);
        return;
    }
    console.log("Connected");
})