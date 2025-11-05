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
  },

  async availableByUtorid(utorid){
    const activePromos = await prisma.promotion.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gt: now },
      }
    });

    const used = await prisma.promotionUsage.findMany({
      where: { utorid },
      select: { promotionId: true }
    });
    const usedIds = new Set(used.map(u => u.promotionId));

    const available = activePromos.filter(p => !(p.type === 'onetime' && usedIds.has(p.id)));

    return available;
  }
};

module.exports = promotionRepository;
