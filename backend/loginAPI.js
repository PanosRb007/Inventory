const express = require('express');
const jwt = require('jsonwebtoken');

const usersrouter = (secretKey, pool) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Fetch user data from your data source (e.g., a database)
      const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
      const [results] = await pool.query(sql, [username, password]);
  
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
  
      // Assuming you have retrieved a user from your data source
      console.log('reuslts',res);
      const user = results[0];
  
      // Generate a JWT token
      const token = jwt.sign({ userId: user.id, userRole: user.role }, secretKey, { expiresIn: '11h' });
      console.log('token', token);
  
      res.json({ success: true, token, role: user.role });
    } catch (error) {
      console.error('Error retrieving user:', error);
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  });


  return router;
};

module.exports = usersrouter;

