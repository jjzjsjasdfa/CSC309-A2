const eventsRepository = require("../repositories/eventsRepository");

const eventsService = {
  async registerEvent(name, description, location, startTime, endTime, points, capacity) {

    return await eventsRepository.createEvent(name, description, location, startTime, endTime, points, capacity);
  },

   async getEventsWithSkipAndLimit(where, skip, limit){
    return await eventsRepository.findManyWithSkipAndLimit(where, skip, limit);
  },
    async getEvents(where){
    return await eventsRepository.findMany(where);
  },
}
module.exports = eventsService;