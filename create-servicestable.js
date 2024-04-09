var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root123", 
    database: "128projtest"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    var sql_database = "CREATE TABLE services (id INT PRIMARY KEY AUTO_INCREMENT, userId int, serviceName VARCHAR(100), servicePrice DECIMAL(10, 2), emirate VARCHAR(100), location VARCHAR(100) NOT NULL, dateTime DATETIME, plateNumber char(6), paymentMethod varchar(20), totalPrice DECIMAL(10, 2) NOT NULL, FOREIGN KEY (userId) REFERENCES users(id), CONSTRAINT chk_plate_number_pattern CHECK (plateNumber REGEXP '^[A-Z][0-9]{5}$'));";
    con.query(sql_database, function (err, result) {
        if (err) throw err;
        console.log("Services Table Created");
    });
});