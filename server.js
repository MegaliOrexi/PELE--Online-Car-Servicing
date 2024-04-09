const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const ejs = require('ejs');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');


const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: '128projtest'
});

connection.connect((error) => {
  if (error) {
    console.error('Error connecting to database:', error);
  } else {
    console.log('Connected to database');
  }
});


// Session management
const sessionStore = new MySQLStore({
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: '128projtest',
  createDatabaseTable: true,  //create table if it doesnr exist
}, connection);


// Session middleware setup
app.use(
  session({
    genid: (req) => uuidv4(), // Generate a unique sessionId for each session
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { secure: false }
  })
);
const port = 8080;


// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

//-----------------------------------------------------------------

app.use(bodyParser.json());

//-----------------------------------------------------------------

const disableLoginCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};

app.get('/login', disableLoginCache, (req, res) => {
  const { loginError, signupError } = req.session;
  req.session.loginError = null;
  req.session.signupError = null;
  res.render('login', { loginError, signupError });
});

app.get('/signup', (req, res) => {
  const { loginError, signupError } = req.session;
  req.session.loginError = null;
  req.session.signupError = null;
  res.render('login', { loginError, signupError });
});

//--------------------------------------------------------------------------------------------

app.get('/forgotpassword', disableLoginCache, (req, res) => {
  const { errorMessage } = req.session;
  req.session.errorMessage = null;
  res.render('forgotpassword', { errorMessage });
});

app.post('/forgotpassword', (req, res) => {
  const { email } = req.body;
  const query = `SELECT * FROM users WHERE email = '${email}'`;

  connection.query(query, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    } else if (results.length === 0) {
      const errorMessage = 'No such email exists.';
      req.session.errorMessage = errorMessage;
      res.redirect('/forgotpassword');
    } else {
      // Generate and send OTP to the email
      const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'contactformpele@gmail.com',
          pass: 'jhhglfjhsxolbydv',
        },
      });

      const mailOptions = {
        from: 'contactformpele@gmail.com', // Replace with your Gmail email
        to: email,
        subject: 'Forgot Password - OTP',
        text: `Your OTP for password reset is: ${otp}`,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error(error);
          res.status(500).send('An error occurred');
        } else {
          req.session.resetData = {
            email,
            otp,
          };
          res.redirect('/resetpassword');
        }
      });
    }
  });
});

app.get('/resetpassword', (req, res) => {
  const resetData = req.session.resetData;
  if (!resetData) {
    res.redirect('/forgotpassword');
    return;
  }

  const { errorMessage } = req.session;
  req.session.errorMessage = null;
  res.render('resetpassword', { errorMessage });
});

app.post('/resetpassword', (req, res) => {
  const resetData = req.session.resetData;
  if (!resetData) {
    res.redirect('/forgotpassword');
    return;
  }

  const { otp, newPassword } = req.body;

  if (otp.toString() !== resetData.otp.toString()) {
    const errorMessage = 'Wrong OTP. Please try again.';
    req.session.errorMessage = errorMessage;
    res.redirect('/resetpassword');
    return;
  }

  const updateQuery = `UPDATE users SET password = '${newPassword}' WHERE email = '${resetData.email}'`;

  connection.query(updateQuery, (error) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    } else {
      req.session.resetData = null;
      res.redirect('/login'); // Redirect to the login page after password reset
    }
  });
});


//--------------------------------------------------------------------------------------------

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;

  connection.query(query, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    } else if (results.length === 0) {
      const errorMessage = 'Invalid email or password.';
      res.render('login', { loginError: errorMessage, signupError: null });
    } else {
      req.session.username = results[0].username;
      const user = results[0];
      req.session.userId = user.id;
      res.redirect('/index');
    }
  });
});

app.post('/signup', (req, res) => {
  const { username, phoneNumber, email, password } = req.body;

  // Check if the username, phoneNumber, and email already exist in the database
  const checkQuery = `SELECT * FROM users WHERE username = '${username}' OR phoneNumber = '${phoneNumber}' OR email = '${email}'`;

  connection.query(checkQuery, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    } else if (results.length > 0) {
      // If any of the fields already exist, return an error message
      const existingFields = results.map((row) => {
        if (row.username === username) return 'Username';
        if (row.phoneNumber === phoneNumber) return 'Phone Number';
        if (row.email === email) return 'Email';
      });

      const errorMessage = `${existingFields.join(', ')} already exists`;
      res.render('login', { loginError: null, signupError: errorMessage });
    } else {
      const insertQuery = `INSERT INTO users (username, phoneNumber, email, password) VALUES ('${username}', '${phoneNumber}', '${email}', '${password}')`;

      connection.query(insertQuery, (error) => {
        if (error) {
          console.error(error);
          res.status(500).send('An error occurred');
        } else {
          res.redirect('/login');
        }
      });
    }
  });
});

//------------------------------------------

const disableCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};


app.get('/index', disableCache, (req, res) => {
    const loggedIn = req.session.username;
    res.render('index', { loggedIn });
  });
  
  app.get('/', (req, res) => {
    res.redirect('/index');
  });
  
  app.get('/about', disableCache, function (req, res) {
    const loggedIn = req.session.username;
    res.render('about', { loggedIn }); // Pass the loggedIn variable to the about.ejs template
  });
  

  app.get('/services', disableCache, function (req, res) {
    const loggedIn = req.session.username;
    res.render('services', { loggedIn }); 
  });

  app.get('/services2', disableCache, function (req, res) {
    const loggedIn = req.session.username;
    res.render('services2', { loggedIn }); 
  });
  
  app.get('/contact', disableCache, function (req, res) {
    const loggedIn = req.session.username;
    res.render('contact', { loggedIn }); 
  });

  app.get('/subscription', disableCache, function (req, res) {
    const loggedIn = req.session.username;
    res.render('subscription', { loggedIn }); 
  });

  const requireLogin = (req, res, next) => {
    if (req.session.username) {
      // User is logged in, proceed to the next middleware
      next();
    } else {
      // User is not logged in, redirect to the login page
      res.redirect('/login');
    }
  };

  app.get('/Payment', requireLogin, disableCache, function (req, res) {
    res.render('Payment');
  });

  app.get('/paymentsuccess', requireLogin, disableCache, function (req, res) {
    res.render('paymentsuccess');
  });
  //------------------------------------------

  function getServiceStatus(dateTime) {
    const serviceDate = new Date(dateTime);
    const currentDate = new Date();
    const options = { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return serviceDate <= currentDate ? 'Fulfilled' : 'Confirmed';
  }

  app.get('/accdet', disableCache, function (req, res) {
    const userId = req.session.userId;
  
    if (!userId) {
      res.redirect('/index'); // Redirect to login if user is not logged in
      return;
    }
  
    //const query = `SELECT * FROM users WHERE id = ${userId}`;

    const query = `
  SELECT u.*, s.serviceName, s.dateTime, s.totalPrice
  FROM users AS u
  LEFT JOIN services AS s ON u.id = s.userId
  WHERE u.id = ${userId}
`;
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('An error occurred');
      } else if (results.length === 0) {
        res.status(404).send('User not found');
      } else {
        const user = results[0];
        const services = results.filter((result) => result.serviceName);
        res.render('accdet', { user, accDetError: null, services, getServiceStatus: getServiceStatus });
      }
    });
  });
  

// ...
app.post('/updateAccount', disableCache, (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.redirect('/index')
    return;
  }

  const { username, phoneNumber, email, password } = req.body;

  // Check if the new username, phoneNumber, or email already exist in the database for other users
  const checkQuery = `
    SELECT *
    FROM users
    WHERE (username = '${username}' OR phoneNumber = '${phoneNumber}' OR email = '${email}') AND id <> ${userId}
  `;

  connection.query(checkQuery, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred');
      return;
    }

    if (results.length > 0) {
      // If any of the fields already exist for other users, collect the field names
      const existingFields = [];
      if (results[0].username === username) {
        existingFields.push('Username');
      }
      if (results[0].phoneNumber === phoneNumber) {
        existingFields.push('Phone Number');
      }
      if (results[0].email === email) {
        existingFields.push('Email');
      }

      const errorMessage = `${existingFields.join(', ')} already exists`;
      res.render('accdet', { user: req.session.username, accDetError: errorMessage, services: [], getServiceStatus: getServiceStatus });
    } else {
      // Perform the update if no conflicts exist
      const updateQuery = `
        UPDATE users
        SET username = '${username}', phoneNumber = '${phoneNumber}', email = '${email}', password = '${password}'
        WHERE id = ${userId}
      `;

      connection.query(updateQuery, (error) => {
        if (error) {
          console.error(error);
          res.status(500).send('An error occurred');
        } else {
          res.redirect('/accdet');
        }
      });
    }
  });
});

//...

//---
app.post('/checkout', (req, res) => {
  const userId = req.session.userId;
  const {
    serviceName,
    servicePrice,
    emirate,
    location,
    dateTime,
    plateNumber,
    paymentMethod,
    totalPrice
  } = req.body;

  if (!userId) {
    res.redirect('/index');
    return;
  }

  // console.log('Received form data:', req.body);

  const query = `INSERT INTO services (userId, serviceName, servicePrice, emirate, location, dateTime, plateNumber, paymentMethod, totalPrice)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [userId, serviceName, servicePrice, emirate, location, dateTime, plateNumber, paymentMethod, totalPrice];

  // console.log('Executing query:', query);
  // console.log('Query values:', values);

 connection.query(query, values, (error) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    } else {
      // Redirect to the paymentsuccess page
      res.redirect('/paymentsuccess');
    }
  });
});
//---

//-----
const transporter = nodemailer.createTransport({
  service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'contactformpele@gmail.com',
        pass: 'jhhglfjhsxolbydv',
      },
});

app.post('/contact', (req, res) => {
  const { name, email, topic, message } = req.body;

  // Create the email message
  const mailOptions = {
    from: 'contactformpele@gmail.com', // Update with your email address
    to: 'mohammad.zain575@gmail.com', // Update with the recipient email address
    subject: topic,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    } else {
      console.log('Email sent:', info.response);
      res.redirect('/'); // Redirect to the home page or any other page you want
    }
  });
});
//-----

app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error(error);
    }
    res.redirect('/login');
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

