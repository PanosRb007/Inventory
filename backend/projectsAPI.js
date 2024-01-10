const express = require('express');

const createprojectRouter = (pool) => {
  const router = express.Router();

  // Get all projects
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM projects';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving projects:', error);
      res.status(500).json({ error: 'Failed to retrieve projects' });
    }
  });

  // Get a specific project by prid
  router.get('/:prid', async (req, res) => {
    const { prid } = req.params;
    try {
      const sql = 'SELECT * FROM projects WHERE prid = ?';
      const [results] = await pool.query(sql, [prid]);
      if (results.length === 0) {
        res.status(404).json({ error: 'project not found' });
      } else {
        res.status(200).json(results[0]);
      }
    } catch (error) {
      console.error('Error retrieving project:', error);
      res.status(500).json({ error: 'Failed to retrieve project' });
    }
  });

  // Add a new project
  router.post('/', async (req, res) => {
    const { name, description, prmatcost , prlabcost ,sale, realmatcost, reallabcost, totalcost, enddate  } = req.body;
    try {
      const sql = 'INSERT INTO projects (name, description, prmatcost , prlabcost ,sale, realmatcost, reallabcost, totalcost, enddate ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      await pool.query(sql, [name, description, prmatcost , prlabcost ,sale, realmatcost, reallabcost, totalcost, enddate ]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error adding project:', error);
      res.status(500).json({ error: 'Failed to add project' });
    }
  });

  // Update an existing project
  router.put('/:prid', async (req, res) => {
    const { prid } = req.params;
    const { name, description, prmatcost , prlabcost ,sale, realmatcost, reallabcost, totalcost, enddate, status  } = req.body;
    try {
      const sql = 'UPDATE projects SET name = ?, description = ?, prmatcost = ?, prlabcost = ?, sale = ?, realmatcost = ?, reallabcost = ?, totalcost = ?, enddate = ?, status = ? WHERE prid = ?';
      await pool.query(sql, [name, description, prmatcost , prlabcost, sale, realmatcost, reallabcost, totalcost, enddate, status , prid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  // Delete a project
  router.delete('/:prid', async (req, res) => {
    const { prid } = req.params;
    try {
      const sql = 'DELETE FROM projects WHERE prid = ?';
      await pool.query(sql, [prid]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  return router;
};

module.exports = createprojectRouter;

