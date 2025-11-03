const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require('jsonwebtoken');
const multer = require("multer");
const userService = require("../services/userService");


function validateTypeAndValue(req, res, reqField){
  for (const key in req[reqField]) {
    const value = req[reqField][key];

    switch (key) {
      case "utorid":
        if (!/^[a-zA-Z0-9]{7,8}$/.test(value)) {
          return res.status(400).json({ error: `${key} should be alphanumeric, 7-8 characters` });
        }
        break;

      case "password":
      // new password
      case "new":
        if (value.length < 8 || value.length > 20) {
          return res.status(400).json({ error: "Password must be 8-20 characters long" });
        }

        if (!/[A-Z]/.test(value)) {
          return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
        }

        if (!/[a-z]/.test(value)) {
          return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
        }

        if (!/[0-9]/.test(value)) {
          return res.status(400).json({ error: "Password must contain at least one number" });
        }

        // From https://stackoverflow.com/questions/18057962/regex-pattern-including-all-special-characters#:~:text=you%20want%20to%20include%20.%2D_%20as%20well
        if (!/[-._!"`'#%&,:;<>=@{}~\$\(\)\*\+\/\\\?\[\]\^\|]/.test(value)) {
          return res.status(400).json({ error: "Password must contain at least one special character" });
        }
        break;

      case "name":
        if (!/^.{1,50}$/.test(value)) {
          return res.status(400).json({ error: `${key} should be 1-50 characters` });
        }
        break;

      case "role":
        if(value !== "regular" && value !== "cashier" && value !== "manager" && value !== "superuser"){
          return res.status(400).json({ error: `${key} should be regular, cashier, manager, or superuser` });
        }
        break;

      case "email":
        if (!/^.+@mail\.utoronto\.ca$/.test(value)) {
          return res.status(400).json({ error: `${key} should be valid University of Toronto email in the format name@mail.utoronto.ca` });
        }
        break;

      case "verified":
      case "activated":
      case "suspicious":
        if (typeof value === "boolean") break;
        if (!/^(true|false)$/.test(value)) {
          return res.status(400).json({ error: `${key} field should be boolean` });
        }
        break;

      case "birthday":
        if(!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isNaN(new Date(value).getTime())){
          return res.status(400).json({ error: `${key} field is not a valid date` });
        }
        break;

      case "avatar":
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: "Avatar file is required" });
        }

        if (!file.mimetype.startsWith("image/")) {
          return res.status(400).json({ error: "Avatar must be an image" });
        }
        break;

      case "page":
      case "limit":
        if (!/^[0-9]+$/.test(value)) {
          return res.status(400).json({ error: `${key} field should be integer` });
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

    // put id and role in req.user
    req.user = userData;

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
function validatePayload(expectedFields, reqField) {
  return (req, res, next) => {
    const actualFields = Object.keys(req[reqField]);
    const requiredFields = expectedFields.required;
    const optionalFields = expectedFields.optional;
    const allFields = requiredFields + optionalFields

    // Check for missing fields
    const missing = requiredFields.filter(f => !actualFields.includes(f));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing field(s): ${missing.join(', ')}` });
    }

    // Check for extra fields
    const extra = actualFields.filter(f => !allFields.includes(f));
    if (extra.length > 0) {
      return res.status(400).json({ error: `Unknown field(s): ${extra.join(', ')}` });
    }

    const error = validateTypeAndValue(req, res, reqField);
    if (error) return;

    next();
  };
}

// verify userId is numerical and user with userId exists
// specifically used in the route "/user/:userId"
async function verifyUserId(req, res, next){
  const id = req.params.userId;
  if(!/^\d+$/.test(id)){
    return res.status(400).json({ error: `userId must be a number`});
  }

  const user = await userService.getUserById(id);
  if(!user){
    return res.status(404).json({ error: `User with id ${id} cannot be found`});
  }

  next();
}

module.exports = { authenticateToken, authorization, validatePayload, verifyUserId };