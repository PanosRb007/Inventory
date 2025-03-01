const express = require('express');

const router = express.Router();

module.exports = (pool) => {

  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM material_changes'; // Corrected the SQL query string
      const { pool } = req.app.locals;
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving vendors:', error);
      res.status(500).json({ error: 'Failed to retrieve vendors' });
    }
  });
  // Define routes for material changes
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
  
  
  router.post('/', async (req, res) => {
    
  
    try {
      const { material_id, price, vendor} = req.body;
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
  
  
  router.put('/:changeId', async (req, res) => {
    const { changeId } = req.params;
    const { price, vendor} = req.body;
  
    try {
      // Check if all required properties are provided in the request body
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
  
  
  router.delete('/:changeId', (req, res) => {
    const { changeId } = req.params;
  
    const sql = `DELETE FROM material_changes WHERE material_id = ?`;
  
    pool.query(sql, [changeId], (error, results) => {
      if (error) {
        console.error('Error deleting material change:', error);
        res.status(500).json({ error: 'Failed to delete material change' });
      } else {
        res.status(200).json({ success: true });
      }
    });
  });
  

  return router;
};
