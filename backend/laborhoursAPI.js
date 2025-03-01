const express = require('express');

const createLaborRouter = (pool) => {
  const router = express.Router();

  // Get all LaborHours
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM LaborHours';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving LaborHours:', error);
      res.status(500).json({ error: 'Failed to retrieve LaborHours' });
    }
  });

  // Get a specific LaborHours by labid
  router.get('/:labid', async (req, res) => {
    const { labid } = req.params;
    try {
      const sql = 'SELECT * FROM LaborHours WHERE labid = ?';
      const [results] = await pool.query(sql, [labid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'LaborHours not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving LaborHours:', error);
      res.status(500).json({ error: 'Failed to retrieve LaborHours' });
    }
  });

  // Add a new LaborHours
  router.post('/', async (req, res) => {
    const { date, employeeid, projectid , start ,end} = req.body;
    try {
      const sql = 'INSERT INTO LaborHours (date, employeeid, projectid , start ,end ) VALUES (?, ?, ?, ?, ?)';
      await pool.query(sql, [date, employeeid, projectid , start ,end ]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding LaborHours:', error);
      res.status(500).json({ error: 'Failed to add LaborHours' });
    }
  });

  // Update an existing LaborHours
  router.put('/:labid', async (req, res) => {
    const { labid } = req.params;
    const {date, employeeid, projectid , start ,end  } = req.body;
    try {
      const sql = 'UPDATE LaborHours SET date = ?, employeeid = ?, projectid = ?, start = ?, end = ? WHERE labid = ?';
      await pool.query(sql, [date, employeeid, projectid , start ,end , labid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating LaborHours:', error);
      res.status(500).json({ error: 'Failed to update LaborHours' });
    }
  });

  // Delete a LaborHours
  router.delete('/:labid', async (req, res) => {
    const { labid } = req.params;
    try {
      const sql = 'DELETE FROM LaborHours WHERE labid = ?';
      await pool.query(sql, [labid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting LaborHours:', error);
      res.status(500).json({ error: 'Failed to delete LaborHours' });
    }
  });

  return router;
};

module.exports = createLaborRouter;

