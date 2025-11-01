const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');
const userService = require("../services/userService");

function validateTypeAndValue(reqField, res){
  for (const key of reqField) {
      switch(key){
        case "utorid":
          if(!/^[a-zA-Z0-9]{7,8}$/.test(reqField.key)){
            res.status(400).json({error: "utorid should be alphanumeric, 7-8 characters"});
          }
        case "name" && !/^.{1,50}$/.test(reqField.name)) {
        res.status(400).json({error: "name should be 1-50 characters"});
      } else if (key === "email" && !/^.+@mail\.utoronto\.ca$/.test(reqField.email)) {
        res.status(400).json({error: "email should be valid University of Toronto email in the format name@mail.utoronto.ca"});
      } else if (key === "verified" && reqField.verified !== "true" && reqField.verified !== "false") {
        res.status(400).json({error: "Payload field that is supposed to be boolean is not boolean"});
      } else if (key === "activated" && req.body.verified !== "true" && req.body.verified !== "false") {
        res.status(400).json({error: "Payload field that is supposed to be boolean is not boolean"});
      } else if (key === "page" && !!/^[0-9]+$/.test(req.query[key])) {
        res.status(400).json({error: "Payload field that is supposed to be boolean is not boolean"});
      }
    }
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

    const extra = actualFields.filter(f => !expectedFields.includes(f));
    if (extra.length > 0) {
      return res.status(400).json({error: `Extra fields: ${extra.join(', ')}`});
    }

    validateTypeAndValue(req.body);
    next();
  };
}

// payload verification
// Ensure 1. all required fields exist 2. no extra fields
function validateQueryPayload(expectedFields) {
  return (req, res, next) => {
    const actualFields = Object.keys(req.body);

    // Check for missing fields
    const missing = expectedFields.filter(f => !actualFields.includes(f));
    if (missing.length > 0 && required) {
      return res.status(400).json({error: `Missing fields: ${missing.join(', ')}`});
    }

    const extra = actualFields.filter(f => !expectedFields.includes(f));
    if (extra.length > 0) {
      return res.status(400).json({error: `Extra fields: ${extra.join(', ')}`});
    }

    validateTypeAndValue(req.query);
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