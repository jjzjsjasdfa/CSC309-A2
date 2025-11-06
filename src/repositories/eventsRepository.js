const prisma = require("../../prisma/prismaClient");

const eventsRepository = {
  async createEvent(name, description, location, startTime, endTime, pointsRemain, capacity) {

    const data = { name, description, location, startTime, endTime, pointsRemain,  published: false};
    if (capacity !== undefined && capacity !== null){
        data.capacity = capacity;
    }
    return prisma.event.create({data,
      include: {
        organizers: true,
        guests: true,
        _count: {select: {guests: true}}
      } });
  },

  async findManyWithSkipAndLimit(where, skip, limit){
    return prisma.event.findMany({
      where: where,
      include: {_count:{select:{guests: true}}},
      orderBy: {startTime: "asc"},
      skip: skip,
      take: limit,
    });
  },

  async findMany(where){
    return prisma.event.findMany({
      where: where,
      include: {_count: {select: {guests: true}}},
      orderBy: {startTime: "asc"}
    });
  },

  async count(where) {
    return prisma.event.count({ where });
  }
};

module.exports = eventsRepository;
