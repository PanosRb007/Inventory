const express = require('express');
const jwt = require('jsonwebtoken');

const usersrouter = (secretKey, pool) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { username, password } = req.body;

    // Basic request validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
        debug: {
          usernameReceived: !!username,
          passwordReceived: !!password,
        },
      });
    }

    try {
      // Check if JWT secret exists before doing anything else
      if (!secretKey) {
        return res.status(500).json({
          success: false,
          error: 'JWT secret is missing',
          debug: {
            jwtSecretLoaded: false,
          },
        });
      }

      const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
      const [results] = await pool.query(sql, [username, password]);

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          debug: {
            rowsFound: 0,
          },
        });
      }

      const user = results[0];

      // Validate required user fields before generating token
      if (user.id === undefined || user.role === undefined) {
        return res.status(500).json({
          success: false,
          error: 'User row is missing required columns',
          debug: {
            expectedColumns: ['id', 'role'],
            actualColumns: Object.keys(user),
            userPreview: user,
          },
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          userRole: user.role,
        },
        secretKey,
        { expiresIn: '11h' }
      );

      return res.json({
        success: true,
        token,
        role: user.role,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Login failed',
        debug: {
          message: error.message || null,
          code: error.code || null,
          errno: error.errno || null,
          sqlState: error.sqlState || null,
          sqlMessage: error.sqlMessage || null,
          jwtSecretLoaded: !!secretKey,
          usernameReceived: !!username,
          passwordReceived: !!password,
        },
      });
    }
  });

  return router;
};

module.exports = usersrouter;