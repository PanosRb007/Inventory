const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const materialChangesRouter = require('./materialchangesAPI');
const AddVendorAPI = require('./AddVendorAPI');
const PurchasesAPI = require('./purchaseAPI');
const MateriallistAPI = require('./materiallistAPI');
const employeesAPI = require('./employeesAPI');
const projectsAPI = require('./projectsAPI');
const projectWebhook = require('./project_webhook');
const stocksAPI = require('./stocksAPI');
const outflowsAPI = require('./outflowsAPI');
const locationsAPI = require('./locationsAPI');
const loginAPI = require('./loginAPI');
const saveCombinedMaterial = require('./saveCombinedMaterial');
const combinedMaterials = require('./combinedMaterials');
const order_listAPI = require('./order_listAPI');
const laborhoursAPI = require('./laborhoursAPI');
const remainingQuantityAPI = require('./remaining_quantityAPI');

dotenv.config();
dotenv.config({ path: 'env' });

const secretKey = process.env.JWT_SECRET;
const app = express();
const port = process.env.PORT || 8081;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const corsOptions = {
  origin: 'https://inventory.robbie.gr',
  optionsSuccessStatus: 200,
};

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('combined'));
app.locals.pool = pool;

function authenticateToken() {
  return (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
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

// Public route
app.use('/api/loginAPI', loginAPI(secretKey, pool));
app.use('/api/webhook', projectWebhook(pool));

// Protected routes
app.use('/api/materialchangesAPI', authenticateToken(), materialChangesRouter(pool));
app.use('/api/vendors', authenticateToken(), AddVendorAPI(pool));
app.use('/api/PurchasesAPI', authenticateToken(), PurchasesAPI(pool));
app.use('/api/materiallist', authenticateToken(), MateriallistAPI(pool));
app.use('/api/employeesAPI', authenticateToken(), employeesAPI(pool));
app.use('/api/projectsAPI', authenticateToken(), projectsAPI(pool));
app.use('/api/stocksAPI', authenticateToken(), stocksAPI(pool));
app.use('/api/outflowsAPI', authenticateToken(), outflowsAPI(pool));
app.use('/api/LocationsAPI', authenticateToken(), locationsAPI(pool));
app.use('/api/submaterials', authenticateToken(), saveCombinedMaterial(pool));
app.use('/api/combinedMaterials', authenticateToken(), combinedMaterials(pool));
app.use('/api/order_listAPI', authenticateToken(), order_listAPI(pool));
app.use('/api/laborhoursAPI', authenticateToken(), laborhoursAPI(pool));
app.use('/api/remaining_quantityAPI', authenticateToken(), remainingQuantityAPI(pool));

// JSON 404 handler for API routes
app.use('/api/*', (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'API Route not found',
    path: req.originalUrl,
  });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route to serve the React app for non-API requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: 'Something broke',
    debug: {
      message: err.message || null,
      stack: err.stack || null,
    },
  });
});

// Prevent unhandled rejections from killing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});