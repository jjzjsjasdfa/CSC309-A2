const transactionRepository = require("../repositories/transactionRepository");


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
    }
}


module.exports = transactionService;