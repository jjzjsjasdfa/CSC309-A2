const transactionService = require("../services/transactionService");
const userService = require("../services/userService");
const userRepository = require("../repositories/userRepository");
const promotionRepository = require("../repositories/promotionRepository");
const promotionService = require("../services/promotionService");

const transactionController = {
    async createTransaction(req, res) {
        let { utorid, type, promotionIds, remark } = req.body;

        let transactionData = {}
        let includePromotions = false;

        const transactionUser = await userService.getUserByUtorid(utorid);
        if (!transactionUser){
            return res.status(404).json({ error: `Transaction user not Found` });
        }
        transactionData.utorid = transactionUser.utorid;

        const createdByUser = await userRepository.findById(req.user.id);
        transactionData.createdBy = createdByUser.utorid;

        // check if promotionIds are valid
        let promotions = [];
        transactionData.promotions = { connect: [] };
        if (promotionIds === undefined || promotionIds.length === 0){
            promotionIds = [];
            transactionData.promotions = {};
        }else{
            const availablePromos = await promotionRepository.availableByUtorid(utorid);
            const availablePromoIds = availablePromos.map(p => p.id);

            // check if all promoIds are valid
            for(const id of promotionIds){
                if(!availablePromoIds.includes(id)){
                    return res.status(400).json({ error: "Invalid promoId" });
                }
                const promo = await promotionRepository.findById(id);
                promotions.push(promo);

                transactionData.promotions.connect.push({ id });
                includePromotions = true;
            }
        }

        if(remark === undefined) remark = "";
        transactionData.remark = remark;



        if (type === "purchase") {
            transactionData.type = "purchase";

            // verify the payload
            const { spent } = req.body;
            if (typeof spent !== "number") {
                return res.status(400).json({ error: "spent should be a number" });
            }
            transactionData.spent = spent;

            // calculated the earned points and update user points
            // basic points
            let earned = Math.round(spent * 4);

            // promotion points
            for (const promotion of promotions) {
                // promotion is used
                if(promotion.minSpending === undefined ||
                  (promotion.minSpending !== undefined && spent !== undefined && spent >= promotion.minSpending)){
                  // earn promotion points
                  const fixedPoints = promotion.points === undefined ? 0 : promotion.points;
                  earned += fixedPoints;
                  if (promotion.rate != null) earned += Math.round(spent * promotion.rate * 100);

                  // update the table
                  await promotionService.usePromotion(transactionUser.id, promotion.id);
                }
            }

            transactionData.earned = earned;
            // TODO: check if the points earned is correct

            if (createdByUser.suspicious) {
              transactionData.suspicious = true;
            }

            // create transaction
            const purchase = await transactionService.createPurchaseWithInclude(transactionData, includePromotions);

            // update user points
            if (!createdByUser.suspicious) {
                const updatedTransactionUser = await userRepository.updateUserByUtorid(utorid, { points: { increment: earned } });
            }

            return res.status(201).json({
                id: purchase.id,
                utorid: purchase.utorid,
                type: purchase.type,
                spent: purchase.spent,
                earned: purchase.earned,
                remark: purchase.remark,
                promotionIds: promotionIds,
                createdBy: purchase.createdBy,
            });
        }


        if (type === "adjustment") {
            transactionData.type = "adjustment";

            // verify the payload
            const { amount, relatedId } = req.body;
            if (typeof amount !== "number" || typeof relatedId !== "number") {
                return res.status(400).json({ error: "amount and relatedId should be numbers" });
            }
            transactionData.amount = amount;

            const oldTransaction = promotionRepository.findById(relatedId);
            if (!oldTransaction) {
                return res.status(404).json({ error: "related transaction not found" });
            }
            transactionData.relatedId = relatedId;

            // create transaction
            const adjustment = await transactionService.createAdjustmentWithInclude(transactionData, includePromotions);

            // update user points
            const updatedTransactionUser = await userRepository.updateUserByUtorid(utorid, { points: { increment: amount } });

            return res.status(201).json({
                id: adjustment.id,
                utorid: adjustment.utorid,
                amount: adjustment.amount,
                type: adjustment.type,
                relatedId: adjustment.relatedId,
                remark: adjustment.remark,
                promotionIds: promotionIds,
                createdBy: adjustment.createdBy
            });
        }
    },

    async getTransactions(req, res) {
      let page, limit;
      let where = {};

      if(req.query.amount !== undefined && req.query.operator !== undefined){
        where["amount"][req.query.operator] = parseInt(req.query.amount, 10);
      }

      for(const key in req.query){
        const value = req.query[key];
        if(value !== undefined){
          switch(key){
            case "utorid":
            case "createdBy":
            case "type":
              where[key] = req.query[key];
              break;
            case "suspicious":
              where[key] = req.query[key] === "true";
              break;
            case "promotionId":
              where["promotions"] = {};
              where["promotions"]["some"] = { id: parseInt(req.query[key], 10) };
              break;
            case "relatedId":
            case "amount":
              where[key] = parseInt(req.query[key], 10);
              break;
            case "page":
              page = parseInt(req.query[key], 10);
              break;
            case "limit":
              limit = parseInt(req.query[key], 10);
              break;
          }
        }
      }

      if(page === undefined){
        page = 1;
      }

      if(limit === undefined){
        limit = 10;
      }

      const skip = (page - 1) * limit;

      if(page < 1 || limit < 1){
        return res.status(400).json({ error: "page and limit must be positive integers" });
      }else if(req.query.relatedId !== undefined && req.query.type === undefined){
        return res.status(400).json({ error: "relatedId must be used with type" });
      }else if(req.query.amount !== undefined && req.query.operator === undefined){
        return res.status(400).json({ error: "amount must be used with operator" });
      }else if(req.operator !== undefined && req.operator !== "gte" && req.operator !== "lte"){
        return res.status(400).json({ error: "operator must be gte or lte" });
      }

      let transactions = await transactionService.getTransactionsWithInclude(where, true);
      const count = transactions.length;
      if(!transactions){
        return res.status(200).json({ count: count, results: [], message: "no transactions found with this condition" });
      }

      transactions = await transactionService.getTransactionsWithSkipAndLimitAndInclude(where, skip, limit, true);
      if(!transactions){
        return res.status(200).json({ count: count, results: [], message: "no transactions in this page" });
      }

      return res.status(200).json({
        count: count,
        results: transactions,
      });
    },
}

module.exports = transactionController;