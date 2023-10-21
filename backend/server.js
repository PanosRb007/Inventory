const dotenv = require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const materialChangesRouter = require('./materialchangesAPI');
const getAPI = require('./getAPI');
const AddVendorAPI = require('./AddVendorAPI');
const PurchasesAPI = require('./purchaseAPI');
const MateriallistAPI = require('./materiallistAPI');
const employeesAPI = require('./employeesAPI');
const projectsAPI = require('./projectsAPI');
const stocksAPI = require('./stocksAPI');
const outflowsAPI = require('./outflowsAPI');

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

const corsOptions = {
  origin: 'http://localhost:3000', // 'https://inventory.robbie.gr'
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));
app.locals.pool = pool;
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} took ${duration}ms`);
  });
  next();
});

// Use the materialChangesRouter for /material-changes route
app.use('/materialchangesAPI', materialChangesRouter(pool));
app.use('/vendors', AddVendorAPI(pool));
app.use('/PurchasesAPI', PurchasesAPI(pool));
app.use('/materiallist', MateriallistAPI(pool));
app.use('/employeesAPI', employeesAPI(pool));
app.use('/projectsAPI', projectsAPI(pool));
app.use('/stocksAPI', stocksAPI(pool));
app.use('/outflowsAPI', outflowsAPI(pool));

app.use(getAPI('/materiallist', 'materiallist'));
app.use(getAPI('/materialchangesAPI', 'material_changes'));
app.use(getAPI('/LocationsAPI', 'locations'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
