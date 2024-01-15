const express = require('express');

const createorder_listRouter = (pool) => {
  const router = express.Router();

  // Get all order_list
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM order_list';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving order_list:', error);
      res.status(500).json({ error: 'Failed to retrieve order_list' });
    }
  });

  // Get a specific order_list by order_list_id
  router.get('/:order_list_id', async (req, res) => {
    const { order_list_id } = req.params;
    try {
      const sql = 'SELECT * FROM order_list WHERE order_list_id = ?';
      const [results] = await pool.query(sql, [order_list_id]);
      if (results.length === 0) {
        res.status(404).json({ error: 'order_list not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving order_list:', error);
      res.status(500).json({ error: 'Failed to retrieve order_list' });
    }
  });

  // Add a new order_list
  router.post('/', async (req, res) => {
    const { location_id, material_id, vendor_id} = req.body;
    try {
      const sql = 'INSERT INTO order_list (location_id, material_id, vendor_id) VALUES (?, ?, ?)';
      await pool.query(sql, [location_id, material_id, vendor_id ]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding order_list:', error);
      res.status(500).json({ error: 'Failed to add order_list' });
    }
  });

  // Update an existing order_list
  router.put('/:order_list_id', async (req, res) => {
    const { order_list_id } = req.params;
    const { location_id, material_id, vendor_id, quantity, comments, status} = req.body;
    try {
      const sql = 'UPDATE order_list SET location_id = ?, material_id = ?, vendor_id = ?, quantity = ?, comments = ?, status = ? WHERE order_list_id = ?';
      await pool.query(sql, [location_id, material_id, vendor_id, quantity, comments, status , order_list_id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating order_list:', error);
      res.status(500).json({ error: 'Failed to update order_list' });
    }
  });

  // Delete a order_list
  router.delete('/:order_list_id', async (req, res) => {
    const { order_list_id } = req.params;
    try {
      const sql = 'DELETE FROM order_list WHERE order_list_id = ?';
      await pool.query(sql, [order_list_id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting order_list:', error);
      res.status(500).json({ error: 'Failed to delete order_list' });
    }
  });

  return router;
};

module.exports = createorder_listRouter;

