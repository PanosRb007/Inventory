const express = require('express');

module.exports = (pool) => {
  const router = express.Router(); // ✅ moved inside factory

  // Get all purchases
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM purchase';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving purchases:', error);
      res.status(500).json({ error: 'Failed to retrieve purchases' });
    }
  });

  // Get distinct material IDs for a location
  router.get('/materialid/:location', async (req, res) => {
    try {
      const { location } = req.params;
      const sql = 'SELECT DISTINCT materialid FROM purchase WHERE location = ?';
      const [results] = await pool.query(sql, [location]);
      const uniqueMaterials = [...new Set(results.map(result => result.materialid))];
      res.status(200).json(uniqueMaterials);
    } catch (error) {
      console.error('Error retrieving available materials:', error);
      res.status(500).json({ error: 'Failed to retrieve available materials' });
    }
  });

  // Get distinct widths for a location and material
  router.get('/widths/:location/:materialid', async (req, res) => {
    try {
      const { location, materialid } = req.params;
      const sql = 'SELECT DISTINCT width FROM purchase WHERE location = ? AND materialid = ?';
      const [results] = await pool.query(sql, [location, materialid]);
      const uniqueWidths = [...new Set(results.map(result => result.width))];
      res.status(200).json(uniqueWidths);
    } catch (error) {
      console.error('Error retrieving available widths:', error);
      res.status(500).json({ error: 'Failed to retrieve available widths' });
    }
  });

  // Get distinct lot numbers for a location, material, and width
  router.get('/lots/:location/:materialid/:width', async (req, res) => {
    try {
      const { location, materialid, width } = req.params;
      const sql = 'SELECT DISTINCT lotnumber FROM purchase WHERE location = ? AND materialid = ? AND width = ?';
      const [results] = await pool.query(sql, [location, materialid, width]);
      const uniqueLotNumbers = [...new Set(results.map(result => result.lotnumber))];
      res.status(200).json(uniqueLotNumbers);
    } catch (error) {
      console.error('Error retrieving available lot numbers:', error);
      res.status(500).json({ error: 'Failed to retrieve available lot numbers' });
    }
  });

  // Add a new purchase
  router.post('/', async (req, res) => {
    try {
      const { location, materialid, width, lotnumber, quantity, price, vendor, comments } = req.body;
      if (!location || !materialid || !quantity || !price || !vendor) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      const sql = `INSERT INTO purchase (location, materialid, width, lotnumber, quantity, price, vendor, comments) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      await pool.query(sql, [location, materialid, width, lotnumber, quantity, price, vendor, comments]); // ✅ uses factory pool
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding purchase:', error);
      res.status(500).json({ error: 'Failed to add purchase' });
    }
  });

  // Update an existing purchase
  router.put('/:id', async (req, res) => {
    try {
      const { location, materialid, quantity, width, lotnumber, price, vendor, comments, verification } = req.body;
      const purchaseId = req.params.id;
      const sql = `UPDATE purchase SET location=?, materialid=?, quantity=?, width=?, lotnumber=?, price=?, vendor=?, comments=?, verification=? WHERE id=?`;
      await pool.query(sql, [location, materialid, quantity, width, lotnumber, price, vendor, comments, verification, purchaseId]); // ✅ uses factory pool
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating purchase:', error);
      res.status(500).json({ error: 'Failed to update purchase' });
    }
  });

  // Delete a purchase
  router.delete('/:id', async (req, res) => {
    try {
      const purchaseId = req.params.id;
      const sql = `DELETE FROM purchase WHERE id=?`;
      await pool.query(sql, [purchaseId]); // ✅ uses factory pool
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      res.status(500).json({ error: 'Failed to delete purchase' });
    }
  });

  return router;
};