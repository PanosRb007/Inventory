const express = require('express');

module.exports = (pool) => {
  const router = express.Router(); // ✅ moved inside the factory

  // Get all material changes
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM material_changes';
      const [results] = await pool.query(sql); // ✅ uses pool from factory
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving material changes:', error);
      res.status(500).json({ error: 'Failed to retrieve material changes' });
    }
  });

  // Get latest price and vendor for a specific material
  router.get('/:materialid', async (req, res) => {
    const { materialid } = req.params;
    const selectQuery = `
      SELECT price, vendor
      FROM material_changes
      WHERE material_id = ?
      ORDER BY change_date DESC
      LIMIT 1
    `;
    try {
      const [result] = await pool.query(selectQuery, [materialid]);
      if (result.length > 0) {
        res.json(result[0]);
      } else {
        res.json({});
      }
    } catch (error) {
      console.error('Error fetching material changes:', error);
      res.sendStatus(500);
    }
  });

  // Add a new material change
  router.post('/', async (req, res) => {
    try {
      const { material_id, price, vendor } = req.body;
      const sql = `
        INSERT INTO material_changes (material_id, price, vendor)
        VALUES (?, ?, ?)
      `;
      await pool.query(sql, [material_id, price, vendor]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding material change:', error);
      res.status(500).json({ error: 'Failed to add material change' });
    }
  });

  // Update a material change
  router.put('/:changeId', async (req, res) => {
    const { changeId } = req.params;
    const { price, vendor } = req.body;
    try {
      if (!price || !vendor) {
        return res.status(400).json({ error: 'Price and vendor fields are required' });
      }
      const sql = `
        UPDATE material_changes
        SET price = ?, vendor = ?
        WHERE material_id = ?
      `;
      await pool.query(sql, [price, vendor, changeId]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating material change:', error);
      res.status(500).json({ error: 'Failed to update material change' });
    }
  });

  // ✅ THE FIX — converted from callback to async/await
  router.delete('/:changeId', async (req, res) => {
    const { changeId } = req.params;
    try {
      const sql = `DELETE FROM material_changes WHERE material_id = ?`;
      await pool.query(sql, [changeId]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting material change:', error);
      res.status(500).json({ error: 'Failed to delete material change' });
    }
  });

  return router;
};