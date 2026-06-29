const express = require('express');

const job_categoriesRouter = (pool) => {
  const router = express.Router();

  // Get all employees
  router.get('/', async (req, res) => {
    try {
    const sql = 'SELECT * FROM job_categories';
    const [results] = await pool.query(sql);
    res.status(200).json(results);

    } catch (error) {
      console.error('Error retrieving vendors:', error);
      res.status(500).json({ error: 'Failed to retrieve vendors' });
    }
  });


  return router;
};

module.exports = job_categoriesRouter;
