const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
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
const port = 8443;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'linux19.papaki.gr',
  user: 'robbieinventory',
  password: '123rbb321',
  database: 'inventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(cors());
app.use(bodyParser.json());
app.locals.pool = pool;

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



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
