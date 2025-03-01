const express = require('express');

const locationsAPI = (pool) => {
  const router = express.Router();


  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT * FROM locations';
      const [results] = await pool.query(sql);
      res.status(200).json(results);
    } catch (error) {
      console.error('Error retrieving stocks:', error);
      res.status(500).json({ error: 'Failed to retrieve stocks' });
    }
  });

 

  return router;
};

module.exports = locationsAPI;



