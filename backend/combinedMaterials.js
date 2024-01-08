const express = require('express');

const createcombinedmaterialrouter = (pool) => {
  const router = express.Router();

  // Get all combined materials
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM combined_materials';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving combined materials:', error);
      res.status(500).json({ error: 'Failed to retrieve combined materials' });
    }
  });

  // Get a specific combined material by id
  router.get('/:id', async (req, res) => {
    const { id } = req.params; // Corrected parameter name to match route
    try {
      const sql = 'SELECT * FROM combined_materials WHERE id = ?';
      const [results] = await pool.query(sql, [id]);
      if (results.length === 0) {
        res.status(404).json({ error: 'Combined material not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving combined material:', error);
      res.status(500).json({ error: 'Failed to retrieve combined material' });
    }
  });

  // Add a new combined material
  router.post('/', async (req, res) => {
  const { name, description } = req.body;
  try {
    const sql = 'INSERT INTO combined_materials (name, description) VALUES (?, ?)';
    const result = await pool.query(sql, [name, description]);
    res.status(200).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error adding combined material:', error);
    res.status(500).json({ error: 'Failed to add combined material' });
  }
});

  // Update an existing combined material
  router.put('/:id', async (req, res) => {
    const { id } = req.params; // Corrected parameter name to match route
    const { name, description } = req.body;

    try {
      const sql = 'UPDATE combined_materials SET name = ?, description = ? WHERE id = ?';
      await pool.query(sql, [name, description, id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating combined material:', error);
      res.status(500).json({ error: 'Failed to update combined material' });
    }
  });

  // Delete a combined material
  router.delete('/:id', async (req, res) => {
    const { id } = req.params; // Corrected parameter name to match route

    try {
      const sql = 'DELETE FROM combined_materials WHERE id = ?';
      await pool.query(sql, [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting combined material:', error);
      res.status(500).json({ error: 'Failed to delete combined material' });
    }
  });

  return router;
};

module.exports = createcombinedmaterialrouter;
