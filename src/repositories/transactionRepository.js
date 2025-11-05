const prisma = require("../../prisma/prismaClient");

const transactionRepository = {
    findPromotionIds(ids) {
        return prisma.promotion.findMany({
             where: { id: { in: ids } } 
        });
    },

}


module.exports = transactionRepository;