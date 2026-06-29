const express = require('express');

const createRelatedMaterialsRouter = (pool) => {
  const router = express.Router();

  // GET όλα τα related για ένα υλικό
  router.get('/:materialid', async (req, res) => {
    const { materialid } = req.params;
    try {
      const sql = 'SELECT * FROM related_materials WHERE materialid = ?';
      const [results] = await pool.query(sql, [materialid]);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving related materials:', error);
      res.status(500).json({ error: 'Failed to retrieve related materials' });
    }
  });

  // POST νέο related
  router.post('/', async (req, res) => {
    const { materialid, related_materialid } = req.body;
    if (!materialid || !related_materialid) {
      return res.status(400).json({ error: 'materialid and related_materialid are required' });
    }
    try {
      const sql = 'INSERT INTO related_materials (materialid, related_materialid) VALUES (?, ?)';
      await pool.query(sql, [materialid, related_materialid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding related material:', error);
      res.status(500).json({ error: 'Failed to add related material' });
    }
  });

  // PUT ενημέρωση related (αν χρειαστεί)
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { materialid, related_materialid } = req.body;
    if (!materialid || !related_materialid) {
      return res.status(400).json({ error: 'materialid and related_materialid are required' });
    }
    try {
      const sql = 'UPDATE related_materials SET materialid = ?, related_materialid = ? WHERE id = ?';
      await pool.query(sql, [materialid, related_materialid, id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating related material:', error);
      res.status(500).json({ error: 'Failed to update related material' });
    }
  });

  // DELETE related
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const sql = 'DELETE FROM related_materials WHERE id = ?';
      await pool.query(sql, [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting related material:', error);
      res.status(500).json({ error: 'Failed to delete related material' });
    }
  });

  return router;
};

module.exports = createRelatedMaterialsRouter;