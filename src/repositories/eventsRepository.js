const prisma = require("../../prisma/prismaClient");

const eventsRepository = {
  async createEvent(name, description, location, startTime, endTime, pointsRemain, capacity) {

    data = { name, description, location, startTime, endTime, pointsRemain};
    if (capacity !== undefined && capacity !== null){
        data.capacity = capacity;
    }
    return prisma.event.create({data,
      include: {
        organizers: true,
        guests: true
      } });
  },

  async findManyWithSkipAndLimit(where, skip, limit){
    return prisma.event.findMany({
      where: where,
      skip: skip,
      take: limit,
    });
  },

  async findMany(where){
    return prisma.event.findMany({
      where: where
    });
  },


};

module.exports = eventsRepository;
