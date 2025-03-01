const express = require('express');

const createVendorRouter = (pool) => {
  const router = express.Router();

  // Get all vendors
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM vendors';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving vendors:', error);
      res.status(500).json({ error: 'Failed to retrieve vendors' });
    }
  });

  // Get a specific vendor by vendorid
  router.get('/:vendorid', async (req, res) => {
    const { vendorid } = req.params;
    try {
      const sql = 'SELECT * FROM vendors WHERE vendorid = ?';
      const [results] = await pool.query(sql, [vendorid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'Vendor not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving vendor:', error);
      res.status(500).json({ error: 'Failed to retrieve vendor' });
    }
  });

  // Add a new vendor
  router.post('/', async (req, res) => {
    const { name, field, mail, tel, contactname } = req.body;
    if (!name || !field || !mail || !tel || !contactname) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    try {
      const sql = 'INSERT INTO vendors (name, field, mail, tel, contactname) VALUES (?, ?, ?, ?, ?)';
      await pool.query(sql, [name, field, mail, tel, contactname]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding vendor:', error);
      res.status(500).json({ error: 'Failed to add vendor' });
    }
  });

  // Update an existing vendor
  router.put('/:vendorid', async (req, res) => {
    const { vendorid } = req.params;
    const { name, field, mail, tel, contactname } = req.body;
    if (!name || !field || !mail || !tel || !contactname) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    try {
      const sql = 'UPDATE vendors SET name = ?, field = ?, mail = ?, tel = ?, contactname = ? WHERE vendorid = ?';
      await pool.query(sql, [name, field, mail, tel, contactname, vendorid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating vendor:', error);
      res.status(500).json({ error: 'Failed to update vendor' });
    }
  });

  // Delete a vendor
  router.delete('/:vendorid', async (req, res) => {
    const { vendorid } = req.params;
    try {
      const sql = 'DELETE FROM vendors WHERE vendorid = ?';
      await pool.query(sql, [vendorid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      res.status(500).json({ error: 'Failed to delete vendor' });
    }
  });

  return router;
};

module.exports = createVendorRouter;
