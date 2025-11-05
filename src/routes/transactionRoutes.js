const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

const {authenticateToken, authorization,validatePayload,
} = require("../middleware/middleware");



router.post( "/", authenticateToken, authorization(["cashier", "manager", "superuser"]), 
    (req, res, next) => {
        const type = req.body.type;
        if (type !== "purchase" && type !== "adjustment") {
            return res.status(400).json({ error: "Type Error" });
        }

        const types = {
            purchase: {required: ["utorid", "type", "spent"], 
                optional: ["promotionIds", "remark"],},
            adjustment: {required: ["utorid", "type", "amount", "relatedId"],
                optional: ["promotionIds", "remark"],},
        };

        return validatePayload(types[type], "body")(req, res, next);
    },
    transactionController.createTransaction
);

// router.get( "/", authenticateToken, authorization(["manager", "superuser"]),
//   validatePayload(
//     {optional: ["promotionIds", "remark"],},
//     "body"),
//   transactionController.createTransaction
// );
module.exports = router;