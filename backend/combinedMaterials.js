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

  router.post('/', async (req, res) => {
    const { name, description } = req.body;
    try {
      const sql = 'INSERT INTO combined_materials (name, description) VALUES (?, ?)';
      const result = await pool.query(sql, [name, description]);
  
      // Εάν η βιβλιοθήκη δεν επιστρέφει το insertId, μπορείς να το πάρεις χειροκίνητα
      const insertId = result.insertId || result[0].insertId;
  
      res.status(200).json({ success: true, id: insertId });
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

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Πρώτα διαγραφή από τον πίνακα submaterials
        const subMaterialsSql = 'DELETE FROM submaterials WHERE combined_material_id = ?';
        await pool.query(subMaterialsSql, [id]);

        // Στη συνέχεια, διαγραφή από τον πίνακα combined_materials
        const combinedMaterialsSql = 'DELETE FROM combined_materials WHERE id = ?';
        await pool.query(combinedMaterialsSql, [id]);

        console.log(`Combined material with ID ${id} and its submaterials successfully deleted.`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting combined material and submaterials:', error);
        res.status(500).json({ error: 'Failed to delete combined material and submaterials' });
    }
});

return router;

};

module.exports = createcombinedmaterialrouter;
