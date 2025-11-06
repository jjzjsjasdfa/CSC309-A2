const eventsService = require("../services/eventsService.js");

const eventController = {
  async register(req, res) {
    try {
      const { name: n, description: d, location: l, startTime: sT, endTime: eT, points: p, capacity: c} = req.body;
      const newEvent = await eventsService.registerEvent(n,d,l,sT,eT,p,c);
      const out = {
        id: newEvent.id,
        name: newEvent.n,
        description: newEvent.d,
        location: newEvent.l,
        startTime: newEvent.sT,
        endTime: newEvent.eT,
        capacity: newEvent.c ?? null,
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
      let page = req.query.page ? parseInt(req.query.page, 10) : 1;
      let limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
        return res.status(400).json({error: "page and limit must be positive integers"});
      }

          const where = {};
      if (req.query.name) where.name = {contains: req.query.name, mode: "insensitive"};
      if (req.query.location) where.location = {contains: req.query.location, mode: "insensitive"};
      if (req.user.role === "regular") where.published = true;

      if (req.query.started === "true") where.startTime = {lte: present};
      if (req.query.started === "false") where.startTime = {gt:  present};
      if (req.query.ended === "true")  where.endTime = {lte: present};
      if (req.query.ended === "false") where.endTime = {gt: present};

      let all = await eventsService.getEvents(where);

      if (req.query.showFull !== 'true') {
        all = all.filter(ev => (ev.capacity == null) || (ev._count.guests < ev.capacity));
      }

      const count = all.length;

      const start = (page - 1) * limit;
      const paged = all.slice(start, start + limit);

      const results = paged.map(ev => ({
        id: ev.id,
        name: ev.name,
        location: ev.location,
        startTime: ev.startTime,
        endTime: ev.endTime,
        capacity: ev.capacity ?? null,
        numGuests: ev._count.guests
      }));

      return res.status(200).json({ count, results });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
};

module.exports = eventController;