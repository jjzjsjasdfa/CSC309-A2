const express = require("express")
const router = express.Router();
const { authenticateToken, authorization, validateBodyPayload, validateQueryPayload, verifyUserId } = require('../middleware/middleware');
const userController = require("../controllers/userController");

// "/users"
router.route("/")
  .post(
    authenticateToken,
    authorization(["cashier", "manager", "superuser"]),
    validateBodyPayload(["utorid", "name", "email"]),
    userController.register
  )
  .get(
    authenticateToken,
    authorization(["manager", "superuser"]),
    validateQueryPayload(["name", "role", "verified", "activated", "page", "limit"]),
    userController.getUsers
  )
  .all((req, res) => {
    res.set('Allow', 'GET, POST');
    res.status(405).json({ error: "Method not allowed" });
  });


// "/users/:userId"
router.route("/:userId")
  .get(
    authenticateToken,
    authorization(["cashier", "manager", "superuser"]),
    verifyUserId,
    validateQueryPayload([]),
    userController.getUser
  )
  .patch(
    authenticateToken,
    authorization(["manager", "superuser"]),
    verifyUserId,
    userController.updateUser
  )
  .all((req, res) => {
    res.set('Allow', 'GET, PATCH');
    res.status(405).json({ error: "Method not allowed" });
  });

router.post("/", (req, res) => res.send("User created"));
module.exports = router;