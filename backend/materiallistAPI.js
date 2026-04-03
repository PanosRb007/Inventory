const express = require('express');

module.exports = (pool) => {
  const router = express.Router(); // ✅ moved inside the factory

  // Get all materials
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM materiallist';
      const [results] = await pool.query(sql); // ✅ uses pool from factory, not req.app.locals
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving materials:', error);
      res.status(500).json({ error: 'Failed to retrieve materials' });
    }
  });

  // Get a specific material by matid
  router.get('/:matid', async (req, res) => {
    const { matid } = req.params;
    try {
      const sql = 'SELECT * FROM materiallist WHERE matid = ?';
      const [results] = await pool.query(sql, [matid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'Material not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving material:', error);
      res.status(500).json({ error: 'Failed to retrieve material' });
    }
  });

  // Create a new material
  router.post('/', async (req, res) => {
    try {
      const { matid, name, description, field, unit_of_measure, extras, shelflife, minstock } = req.body;
      const sql = `INSERT INTO materiallist (matid, name, description, field, unit_of_measure, extras, shelflife, minstock) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      await pool.query(sql, [matid, name, description, field, unit_of_measure, extras, shelflife, minstock]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding material:', error);
      res.status(500).json({ error: 'Failed to add material' });
    }
  });

  // Update an existing material
  router.put('/:matid', async (req, res) => {
    const { matid } = req.params;
    const { name, description, field, unit_of_measure, extras, shelflife, minstock } = req.body;
    try {
      const sql = `UPDATE materiallist SET name = ?, description = ?, field = ?, unit_of_measure = ?, extras = ?, shelflife = ?, minstock = ? WHERE matid = ?`;
      await pool.query(sql, [name, description, field, unit_of_measure, extras, shelflife, minstock, matid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating material:', error);
      res.status(500).json({ error: 'Failed to update material' });
    }
  });

  // Delete a material
  router.delete('/:matid', async (req, res) => {
    const { matid } = req.params;
    try {
      const sql = `DELETE FROM materiallist WHERE matid = ?`;
      await pool.query(sql, [matid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting material:', error);
      res.status(500).json({ error: 'Failed to delete material' });
    }
  });

  return router;
};