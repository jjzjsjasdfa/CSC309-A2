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

  async findByEmail(email){
    return prisma.user.findUnique({
      where: { email }
    });
  },

  async findManyWithSkipAndLimit(where, skip, limit){
    return prisma.user.findMany({
      where: where,
      skip: skip,
      take: limit,
    });
  },

  async findMany(where){
    return prisma.user.findMany({
      where: where
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

  async updateUserById(id, data){
    return prisma.user.update({
      where: { id },
      data: data
    });
  },

  async updateUserByUtorid(utorid, data){
    return prisma.user.update({
      where: { utorid },
      data: data
    });
  },

};

module.exports = userRepository;
