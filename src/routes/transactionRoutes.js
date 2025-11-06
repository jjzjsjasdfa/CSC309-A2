const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { validateTransactionPayloads } = require("../middleware/transactionMiddleware");

const {authenticateToken, authorization,validatePayload,
} = require("../middleware/middleware");

router.patch(
  "/transactions/:transactionId/processed",
  authenticateToken,
  authorization(["cashier", "manager", "superuser"]),
  validatePayload({ required: ["process"] }, "body"),
  transactionController.processRedemption
)

router.route("/")
  .post(
  authenticateToken,
  authorization(["cashier", "manager", "superuser"]),
  validateTransactionPayloads,
  transactionController.createTransaction
  )
  .get(
  authenticateToken,
  authorization(["manager", "superuser"]),
  validatePayload(
    { optional: ["name", "createdBy", "suspicious", "promotionId", "type", "relatedId", "amount", "operator", "page", "limit"] },
    "query"),
  transactionController.getTransactions
  );
module.exports = router;