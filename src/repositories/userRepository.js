const prisma = require("../../prisma/prismaClient");

const userRepository = {
  async createRegularUser(utorid, name, email, resetToken, expiresAt){
    return prisma.user.create({
      data: { utorid, name, email, role: "regular", resetToken, expiresAt }
    });
  },

  async findByUtorid(utorid){
    return prisma.user.findUnique({
      where: { utorid }
    });
  },

  async findById(id){
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async findByIdIncludeAvailablePromo(id){
    return prisma.user.findUnique({
      where: { id },
      include: {
        promotions: {
          available: true,
          one_time: true
        }
      }
    });
  },

  async findByIdIncludeAllPromo(id){
    return prisma.user.findUnique({
      where: { id },
      include: {
        promotions: true
      }
    });
  },

  async findMany(where, skip, limit){
    return prisma.user.findMany({
      where: where,
      skip: skip,
      take: limit,
    });
  }
};

module.exports = userRepository;
