require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');

// JWT authentication middleware from week 7 code
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, userData) => {
    if (err) {
      return res.sendStatus(403);
    }

    console.log(userData);
    // put id and role in req.user
    req.user = { id: userData.id, role: userData.role };

    next();
  });
}

//payload verification middleware
export function validateBodyPayload(expectedFields) {
  return (req, res, next) => {
    // Check for missing fields
    const missing = expectedFields.filter(f => !actualFields.includes(f));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }

    // Check for extra fields
    const actualFields = req.body;
    const extra = actualFields.filter(f => !expectedFields.includes(f));
    if (extra.length > 0) {
      return res.status(400).json({ error: `Extra fields: ${extra.join(', ')}` });
    }

    next();
  };
}