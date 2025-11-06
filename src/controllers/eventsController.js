const eventsService = require("../services/eventsService.js");

const eventController = {
  async register(req, res) {
    try {
      const { name: n, description: d, location: l, startTime: sT, endTime: eT, points: p, capacity: c} = req.body;
      const newEvent = await eventsService.registerEvent(n,d,l,sT,eT,p,c);
      const out = {
        id: newEvent.id,
        name: newEvent.name,
        description: newEvent.description,
        location: newEvent.location,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        capacity: newEvent.capacity ?? null,
        pointsRemain: newEvent.pointsRemain,
        pointsAwarded: newEvent.pointsAwarded,
        published: newEvent.published,
        organizers: newEvent.organizers,
        guests: newEvent.guests
      };
      return res.status(201).json(out);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async getEvents(req, res){
    try {
      const present = new Date();
      const page  = Number.isInteger(+req.query.page)  && +req.query.page  > 0 ? +req.query.page  : 1;
      const limit = Number.isInteger(+req.query.limit) && +req.query.limit > 0 ? +req.query.limit : 10;
      const showFull = req.query.showFull === 'true';

      const where = {};
      if (req.query.name) {
        where.name = { contains: req.query.name, mode: "insensitive" };
      }
      if (req.query.location) {
        where.location = { contains: req.query.location, mode: "insensitive" };
      }

      if (req.query.started === "true") where.startTime = {lte: present};
      if (req.query.started === "false") where.startTime = {gt:  present};
      if (req.query.ended === "true")  where.endTime = {lte: present};
      if (req.query.ended === "false") where.endTime = {gt: present};
      
      if (req.user.role === 'regular' || req.user.role === 'cashier') {
        where.published = true;
      } else if (req.query.published === 'true') {
        where.published = true;
      } else if (req.query.published === 'false') {
        where.published = false;
      }

      let events = await eventsService.getEventsWithCounts(where);

      if (!showFull) {
        events = events.filter(ev =>
        ev.capacity == null || (ev._count?.guests ?? 0) < ev.capacity
        );
      }

      const count = events.length;

      const start = (page - 1) * limit;
      const pageItems = events.slice(start, start + limit);

      const results = pageItems.map(ev => ({
        id: ev.id,
        name: ev.name,
        location: ev.location,
        startTime: ev.startTime,
        endTime: ev.endTime,
        capacity: ev.capacity,
        pointsRemain: ev.pointsRemain,
        pointsAwarded: ev.pointsAwarded,
        published: ev.published,
        numGuests: ev._count?.guests ?? 0,
      }));

      return res.status(200).json({ count, results });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
};

module.exports = eventController;