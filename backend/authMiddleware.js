const jwt = require('jsonwebtoken');
const secretKey = '123rbb321'

function authenticateToken() {
  return (req, res, next) => {
    // Get the token from the request headers
    const token = req.header('Authorization');

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify the token using the provided secretKey
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = user;
      next();
    });
  };
}

module.exports = authenticateToken;
