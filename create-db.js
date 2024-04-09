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
    var sql_database = "CREATE DATABASE 128projtest";
    con.query(sql_database, function (err, result) {
        if (err) throw err;
        console.log("Database Created");
    });
});