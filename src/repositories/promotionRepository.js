const prisma = require("../../prisma/prismaClient");

const promotionRepository = {
  async create(data) {
    return prisma.promotion.create({ data });
  },

  async findMany(where = {}) {
    return prisma.promotion.findMany({ where });
  },

  async findById(id) {
    return prisma.promotion.findUnique({ where: { id } });
  },

  async update(id, data) {
    return prisma.promotion.update({ where: { id }, data });
  },

  async delete(id) {
    return prisma.promotion.delete({ where: { id } });
  }
};

module.exports = promotionRepository;
