const transactionRepository = require("../repositories/transactionRepository");
const prisma = require("../../prisma/prismaClient");

const transactionService = {
    async createPurchaseWithInclude(transactionData, includePromotions) {
        return await transactionRepository.createTransaction(transactionData, includePromotions);
    },

    async createAdjustmentWithInclude(transactionData, includePromotions) {
        return await transactionRepository.createTransaction(transactionData, includePromotions);
    },

    async getTransactions(where){
        return await transactionRepository.getTransactions(where)
    },

    async getTransactionsWithInclude(where, includePromotions){
        return await transactionRepository.getTransactionsWithInclude(where, includePromotions)
    },

    async getTransactionsWithSkipAndLimitAndInclude(where, skip, limit, include){
        return await transactionRepository.getTransactionsWithSkipAndLimitAndInclude(where, skip, limit, include);
    },

    async updateSuspicious(id, suspicious) {
        return await prisma.transaction.update({ where: { id }, data: { suspicious }, 
            include: { promotions: true }, });
    },

    async getById(id) {
        return await prisma.transaction.findUnique({ where: { id }, include: { promotions: true },});
    },

}


module.exports = transactionService;