var mysql = require('mysql');
require('dotenv').config();


var con = mysql.createConnection({
    host: "localhost",
    user: process.env.USER_MYSQL,
    password: process.env.PASSWORD_MYSQL, 
    database: "128projtest"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var sql_database = "CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, username varchar(100), phoneNumber varchar(20), email VARCHAR(100), password TEXT);";
    con.query(sql_database, function (err, result) {
        if (err) throw err;
        console.log("User Table Created");
    });
});