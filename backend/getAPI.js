const express = require('express');

function createGetRoute(path, tableName) {
  const router = express.Router();

  router.get(path, async (req, res) => {
    try {
      const sql = `SELECT * FROM ${tableName}`; // Corrected the SQL query string
      const { pool } = req.app.locals;
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving vendors:', error);
      res.status(500).json({ error: 'Failed to retrieve vendors' });
    }
  });

  return router;
}

module.exports = createGetRoute;
