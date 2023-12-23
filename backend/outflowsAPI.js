const express = require('express');

const createoutflowRouter = (pool) => {
  const router = express.Router();

  // Get all outflows
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM outflows';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving outflows:', error);
      res.status(500).json({ error: 'Failed to retrieve outflows' });
    }
  });

  // Get a specific outflow by outflowid
  router.get('/:outflowid', async (req, res) => {
    const { outflowid } = req.params;
    try {
      const sql = 'SELECT * FROM outflows WHERE outflowid = ?';
      const [results] = await pool.query(sql, [outflowid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'outflow not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving outflow:', error);
      res.status(500).json({ error: 'Failed to retrieve outflow' });
    }
  });

  // Add a new outflow
  router.post('/', async (req, res) => {
    const { location, materialid, width, lotnumber, quantity, employee, project, cost, comments } = req.body;
    try {
      const sql = 'INSERT INTO outflows (location, materialid, width, lotnumber, quantity, employee, project, cost, comments) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      await pool.query(sql, [location, materialid, width, lotnumber, quantity, employee, project, cost, comments]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding outflow:', error);
      res.status(500).json({ error: 'Failed to add outflow' });
    }
  });

  // Update an existing outflow
  router.put('/:outflowid', async (req, res) => {
    const { outflowid } = req.params;
    const { location, materialid, width, lotnumber, quantity, employee, project, cost, comments } = req.body;
  
    try {
      const sql = 'UPDATE outflows SET location=?, materialid=?, width=?, lotnumber=?, quantity=?, employee=?, project=?, cost=?, comments=? WHERE outflowid=?';
      await pool.query(sql, [location, materialid, width, lotnumber, quantity, employee, project, cost, comments, outflowid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating outflow:', error);
      res.status(500).json({ error: 'Failed to update outflow' });
    }
  });
  
  

  // Delete a outflow
  router.delete('/:outflowid', async (req, res) => {
    const { outflowid } = req.params;
  
    try {
      const sql = `DELETE FROM outflows WHERE outflowid = ?`;
      await pool.query(sql, [outflowid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting outflow:', error);
      res.status(500).json({ error: 'Failed to delete outflow' });
    }
  });
  return router;
};

module.exports = createoutflowRouter;



