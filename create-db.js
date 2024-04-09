var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root123" 
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