const dotenv = require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const materialChangesRouter = require('./materialchangesAPI');
const AddVendorAPI = require('./AddVendorAPI');
const PurchasesAPI = require('./purchaseAPI');
const MateriallistAPI = require('./materiallistAPI');
const employeesAPI = require('./employeesAPI');
const projectsAPI = require('./projectsAPI');
const stocksAPI = require('./stocksAPI');
const outflowsAPI = require('./outflowsAPI');
const locationsAPI = require('./locationsAPI');
const loginAPI = require('./loginAPI');
const saveCombinedMaterial = require('./saveCombinedMaterial');
const combinedMaterials = require('./combinedMaterials');
const order_listAPI = require('./order_listAPI');
const laborhoursAPI = require('./laborhoursAPI');

const jwt = require('jsonwebtoken');



const secretKey = '123rbb321'
const app = express();
const port = process.env.PORT;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST  ,
  user: process.env.DB_USER  ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME ,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/*const corsOptions = {
  origin: 'https://inventory.robbie.gr', // your frontend server
  optionsSuccessStatus: 200
};*/


app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.locals.pool = pool;

function authenticateToken() {
  return (req, res, next) => {
   
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];


    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
      }
      req.user = user;
      next();
    });
  };
}



// Use the materialChangesRouter for /material-changes route
app.use('/loginAPI', loginAPI(secretKey, pool));
app.use('/materialchangesAPI', authenticateToken(), materialChangesRouter(pool));
app.use('/vendors', authenticateToken(), AddVendorAPI(pool));
app.use('/PurchasesAPI', authenticateToken(), PurchasesAPI(pool));
app.use('/materiallist', authenticateToken(), MateriallistAPI(pool));
app.use('/employeesAPI', authenticateToken(), employeesAPI(pool));
app.use('/projectsAPI', authenticateToken(), projectsAPI(pool));
app.use('/stocksAPI', authenticateToken(), stocksAPI(pool));
app.use('/outflowsAPI', authenticateToken(), outflowsAPI(pool));
app.use('/LocationsAPI', authenticateToken(), locationsAPI(pool));
app.use('/submaterials', authenticateToken(), saveCombinedMaterial(pool));
app.use('/combinedMaterials', authenticateToken(), combinedMaterials(pool));
app.use('/order_listAPI', authenticateToken(), order_listAPI(pool));
app.use('/laborhoursAPI', authenticateToken(), laborhoursAPI(pool));



// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
