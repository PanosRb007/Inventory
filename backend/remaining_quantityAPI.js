const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Return all records
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM remaining_quantity';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving remaining quantities:', {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: 'Failed to retrieve remaining quantities',
        debug: {
          message: error.message || null,
          code: error.code || null,
          errno: error.errno || null,
          sqlState: error.sqlState || null,
          sqlMessage: error.sqlMessage || null,
        },
      });
    }
  });

  router.get('/:location', async (req, res) => {
    const { location } = req.params;

    try {
      const sql = 'SELECT * FROM remaining_quantity WHERE location = ?';
      const [results] = await pool.query(sql, [location]);

      if (results.length === 0) {
        return res.status(404).json({
          error: 'No records found for the specified location',
        });
      }

      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving remaining quantities for location:', {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: 'Failed to retrieve remaining quantities for location',
        debug: {
          message: error.message || null,
          code: error.code || null,
          errno: error.errno || null,
          sqlState: error.sqlState || null,
          sqlMessage: error.sqlMessage || null,
        },
      });
    }
  });

  return router;
};