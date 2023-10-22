const express = require('express');

const createstockRouter = (pool) => {
  const router = express.Router();

  // Get all stocks
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM stocks';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving stocks:', error);
      res.status(500).json({ error: 'Failed to retrieve stocks' });
    }
  });

  // Get a specific stock by stockid
  router.get('/:stockid', async (req, res) => {
    const { stockid } = req.params;
    try {
      const sql = 'SELECT * FROM stocks WHERE stockid = ?';
      const [results] = await pool.query(sql, [stockid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'stock not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving stock:', error);
      res.status(500).json({ error: 'Failed to retrieve stock' });
    }
  });

  // Add a new stock
  router.post('/', async (req, res) => {
    const { materialid, width, lotnumber, quantity, price, location } = req.body;
    try {
      const sql = 'INSERT INTO stocks (materialid, width, lotnumber, quantity, price, location) VALUES (?, ?, ?, ?, ?, ?)';
      await pool.query(sql, [materialid, width, lotnumber, quantity, price, location]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding stock:', error);
      res.status(500).json({ error: 'Failed to add stock' });
    }
  });

  // Update an existing stock
  router.put('/:stockid', async (req, res) => {
    const { stockid } = req.params;
    const { materialid, width, lotnumber, quantity, price, location } = req.body;
    try {
      const sql = 'UPDATE stocks SET materialid = ?, width = ?, lotnumber = ?, quantity = ?, price = ?, location = ? WHERE stockid = ?';
      await pool.query(sql, [materialid, width, lotnumber, quantity, price, location, stockid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  });

  // Delete a stock
  router.delete('/:stockid', async (req, res) => {
    const { stockid } = req.params;
    try {
      const sql = 'DELETE FROM stocks WHERE stockid = ?';
      await pool.query(sql, [stockid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting stock:', error);
      res.status(500).json({ error: 'Failed to delete stock' });
    }
  });

  return router;
};

module.exports = createstockRouter;



