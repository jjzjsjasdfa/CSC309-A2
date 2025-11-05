const prisma = require("../../prisma/prismaClient");
const transactionRepository = require("../repositories/transactionRepository");

async function promotionIdCheck (promotionIds = []){
    if (!promotionIds || promotionIds.length === 0) return [];

    const promotions = await transactionRepository.findPromotionIds(promotionIds);
    if (promotions.length !== promotionIds.length) throw { code: "INVALID_PROM" };

    const current = new Date();
    for (const promotion of promotions) {
        if (promotion.type === "onetime") {
            if (!promotion.avaliable) throw { code: "INVALID_PROM" };
        }
        if (promotion.endTime > current) throw { code: "INVALID_PROM" };
    }

    return promotions;
}

async function earnCalculator (spent, promotions) {
    let earnings = Math.round(spent * 4);
    for (const promotion of promotions) {
        if (promotion.rate != null) earnings += Math.round(spent * promotion.rate);
    }
    return earnings;
}

const transactionService = {
    async createPurchase({ id, utorid, spent, promotionIds, remark }) {
        const user = await prisma.user.findUnique({ where: {utorid} });
        if (!user) throw { code: "NOT_FOUND" };

        const cashier = await prisma.user.findUnique({ where: {id} });
        if (!cashier) throw { code: "NOT_FOUND" };

        if (typeof spent !== "number" || !(spent > 0)) throw { code: "INVALID_PROM" }; 
        const promotions = await promotionIdCheck(promotionIds);

        const earnings = await earnCalculator(spent, promotions);

        const purchase = await prisma.transaction.create({
            data: {type: "purchase", utorid, spent, earned: earnings, remark, promoIds: promotionIds,
                suspicious: cashier.suspicious, amount: earnings
            }
        });

        if (!cashier.suspicious) {
            await prisma.user.update({where: { id: user.id }, data: { points: { increment: earnings } }});
        }


        return {id: purchase.id, utorid: user.utorid, type: "purchase", spent, earned, remark, promotionIds,
            createdBy: cashier.utorid
        };
    }
}


module.exports = transactionService;