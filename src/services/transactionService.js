const prisma = require("../../prisma/prismaClient");
const promotionRepository = require("../repositories/promotionRepository");

async function promotionIdCheck (utorid, promotionIds){
    if (promotionIds === undefined || promotionIds.length === 0) return [];

    const available = await promotionRepository.availableByUtorid(utorid);

    let promotions = [];
    for(const id of promotionIds){
        for(const ava of available){
            if(!ava.id.includes(id)){
                throw { code: "INVALID_PROM" };
            }
            const promo = await promotionRepository.findById(id);
            promotions.push(promo);
        }
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
    async createPurchase({ cashierId, utorid, spent, promotionIds, remark }) {
        const user = await prisma.user.findUnique({ where: {utorid} });
        if (!user) throw { code: "NOT_FOUND" };

        const cashier = await prisma.user.findUnique({ where: { id: cashierId } });
        if (!cashier) throw { code: "NOT_FOUND" };

        if (typeof spent !== "number" || spent < 0) throw { code: "INVALID_PROM" }; 
        const promotions = await promotionIdCheck(utorid, promotionIds);

        const earnings = await earnCalculator(spent, promotions);

        const purchase = await prisma.transaction.create({
            data: {type: "purchase", utorid, spent, earned: earnings, remark, promoIds: promotions,
                suspicious: cashier.suspicious, amount: earnings
            }
        });

        if (!cashier.suspicious) {
            await prisma.user.update({where: { id: user.id }, data: { points: { increment: earnings } }});
        }


        return {id: purchase.id, utorid: user.utorid, type: "purchase", spent, earned: earnings, remark, promotionIds,
            createdBy: cashier.utorid
        };
    }
}


module.exports = transactionService;