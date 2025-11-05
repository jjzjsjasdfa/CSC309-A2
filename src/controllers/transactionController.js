const transactionService = require("../services/transactionService");

const transactionController = {
    async createTransaction(req, res) {
        const type = req.body.type;
        try {
            if (type === "purchase") {
                const { utorid, spent, promotionIds = [], remark = "" } = req.body;

                console.log(utorid, spent);

                if (utorid === undefined || typeof spent !== "number" || spent < 0) {
                    return res.status(400).json({ error: "Bad request" });
                }
                
                const id = req.user.id;
                const purchase = await transactionService.createPurchase({ cashierId: id,
                    utorid, spent, promotionIds, remark});
                return res.status(201).json(purchase);
            }

            if (type === "adjustment") {
                if (!["manager","superuser"].includes(req.user.role)) {
                    return res.status(403).json({ error: "Not Allowed" });
                }

                const { utorid, amount, relatedId, promotionIds = [], remark = "" } = req.body;
                if (!utorid || typeof amount !== "number" || !Number.isInteger(relatedId)) {
                    return res.status(400).json({ error: "Bad request" });
                }

                const id = req.user.id;
                const adjustment = await transactionService.createAdjustment({ id,
                    utorid, amount, relatedId, promotionIds, remark});
                return res.status(201).json(adjustment);
            }
            return res.status(400).json({ error: "Type Error" });
        } catch (error) {
            if (error.code === "NOT_FOUND") {
                return res.status(404).json({ error: "User not Found" });
            }
            if (error.code === "INVALID_PROM") {
                return res.status(400).json({ error: "Bad promoId" });
            }
            return res.status(500).json({ error: "Internal Error" });
        }
    },
}

module.exports = transactionController;