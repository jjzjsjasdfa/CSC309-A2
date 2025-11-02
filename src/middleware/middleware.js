const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');
const userService = require("../services/userService");

function validateTypeAndValue(reqField, res){
  for (const key in reqField) {
    const value = reqField[key];

    switch (key) {
      case "utorid":
        if (!/^[a-zA-Z0-9]{7,8}$/.test(value)) {
          return res.status(400).json({error: `${key} should be alphanumeric, 7-8 characters`});
        }
        break;

      case "name":
        if (!/^.{1,50}$/.test(value)) {
          return res.status(400).json({error: `${key} should be 1-50 characters`});
        }
        break;

      case "email":
        if (!/^.+@mail\.utoronto\.ca$/.test(value)) {
          return res.status(400).json({error: `${key} should be valid University of Toronto email in the format name@mail.utoronto.ca`});
        }
        break;

      case "verified":
      case "activated":
        if (typeof value === "boolean") break;
        if (!/^(true|false)$/.test(value)) {
          return res.status(400).json({error: `${key} field should be boolean`});
        }
        break;

      case "page":
        if (!/^[0-9]+$/.test(value)) {
          return res.status(400).json({error: `${key} field should be integer`});
        }
        break;
    }
  }
  return null;
}

// JWT authentication middleware from week 7 code
function authenticateToken(req, res, next) {
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

// user role authorization
function authorization(allowedRoles) {
  return (req, res, next) => {
    if(!req.user || !allowedRoles.includes(req.user.role)){
      res.status(403).json({ error: "Operation is not allowed on this user role" });
    }
    next();
  };
}

// payload verification
// Ensure 1. all required fields exist 2. no extra fields
function validateBodyPayload(expectedFields) {
  return (req, res, next) => {
    const actualFields = Object.keys(req.body);

    // Check for missing fields
    const missing = expectedFields.filter(f => !actualFields.includes(f));
    if (missing.length > 0 && required) {
      return res.status(400).json({error: `Missing fields: ${missing.join(', ')}`});
    }

    // Check for extra fields
    const extra = actualFields.filter(f => !expectedFields.includes(f));
    if (extra.length > 0) {
      return res.status(400).json({error: `Extra fields: ${extra.join(', ')}`});
    }

    const error = validateTypeAndValue(req.body, res);
    if (error) return;

    next();
  };
}

// payload verification
// Since the payloads are optional, just need to ensure no extra fields
function validateQueryPayload(expectedFields) {
  return (req, res, next) => {
    const actualFields = Object.keys(req.body);

    // Check for extra fields
    const extra = actualFields.filter(f => !expectedFields.includes(f));
    if (extra.length > 0) {
      return res.status(400).json({error: `Extra fields: ${extra.join(', ')}`});
    }

    const error = validateTypeAndValue(req.query, res);
    if (error) return;

    next();
  };
}

// verify userId is numerical and user with userId exists
async function verifyUserId(req, res, next){
  const id = req.params.userId;
  if(!/^\d+$/.test(id)){
    return res.status(400).json({ error: `userId must be a number`});
  }

  const user = await userService.getUser(id);
  if(!user){
    return res.status(404).json({ error: `User with id ${id} cannot be found`});
  }

  req.user = user;
  next();
}

module.exports = { authenticateToken, authorization, validateBodyPayload, verifyUserId, validateQueryPayload };