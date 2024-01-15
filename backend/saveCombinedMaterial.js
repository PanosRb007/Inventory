const express = require('express');

const createsubmaterialrouter = (pool) => {
  const router = express.Router();

  // Get all submaterials
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM submaterials';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving submaterials:', error);
      res.status(500).json({ error: 'Failed to retrieve submaterials' });
    }
  });

  // Get submaterials for a specific combined material
  router.get('/:combined_material_id', async (req, res) => {
    const { combined_material_id } = req.params;
    try {
      const sql = 'SELECT * FROM submaterials WHERE combined_material_id = ?';
      const [results] = await pool.query(sql, [combined_material_id]);
      if (results.length === 0) {
        res.status(404).json({ error: 'Submaterials not found' });
      } else {
        res.status(200).json(results);
      }
    } catch (error) {
      console.error('Error retrieving submaterials:', error);
      res.status(500).json({ error: 'Failed to retrieve submaterials' });
    }
  });

  // Add new submaterials for a combined material
  router.post('/', async (req, res) => {
    const submaterials = req.body.submaterials;
    console.log("Received submaterials:", submaterials);

    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const sql = 'INSERT INTO submaterials (combined_material_id, material_id, multiplier) VALUES ?';
        const values = submaterials.map(sub => [sub.combined_material_id, sub.material_id, sub.multiplier]);

        await connection.query(sql, [values]);
        await connection.commit();
        res.status(200).json({ success: true });
      } catch (error) {
        await connection.rollback();
        console.error('Error during transaction or query:', error);
        res.status(500).json({ error: 'Failed to add submaterials' });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error getting connection:', error);
      res.status(500).json({ error: 'Failed to get connection' });
    }
  });

  // Update an existing submaterial
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { material_id, multiplier } = req.body;

    try {
      const sql = 'UPDATE submaterials SET material_id = ?, multiplier = ? WHERE id = ?';
      await pool.query(sql, [material_id, multiplier, id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating submaterial:', error);
      res.status(500).json({ error: 'Failed to update submaterial' });
    }
  });

  // Delete a submaterial
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const sql = 'DELETE FROM submaterials WHERE combined_material_id = ?';
      await pool.query(sql, [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting submaterial:', error);
      res.status(500).json({ error: 'Failed to delete submaterial' });
    }
  });

  return router;
};

module.exports = createsubmaterialrouter;
