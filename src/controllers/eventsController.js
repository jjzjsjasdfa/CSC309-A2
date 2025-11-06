const eventsService = require("../services/eventsService.js");
const userService = require("../services/userService.js");

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

      function parseBool(v) {
        if (v === undefined) return undefined;
        if (v === true || v === 'true') return true;
        if (v === false || v === 'false') return false;
        throw new Error('invalid boolean');
      }

      const where = {};
      if (req.query.name) {
        where.name = { contains: req.query.name, mode: "insensitive" };
      }
      if (req.query.location) {
        where.location = { contains: req.query.location, mode: "insensitive" };
      }

      // started/ended: 不允许同时给
      if (req.query.started !== undefined && req.query.ended !== undefined) {
        return res.status(400).json({ error: 'cannot specify both started and ended' });
      }
      const started = parseBool(req.query.started);
      const ended   = parseBool(req.query.ended);
      if (started === true)  where.startTime = { lte: present };
      if (started === false) where.startTime = { gt:  present };
      if (ended   === true)  where.endTime   = { lte: present };
      if (ended   === false) where.endTime   = { gt:  present };

      const role = req.user?.role;
      if (role === 'regular' || role === 'cashier') {
        where.published = true;
      } else {
        const published = parseBool(req.query.published);
        if (published !== undefined) where.published = published;
      }

      let events = await eventsService.getEventsWithCounts(where);

      const showFull = parseBool(req.query.showFull) ?? false;
      if (!showFull) {
        events = events.filter(ev =>
          ev.capacity == null || (ev._count?.guests ?? 0) < ev.capacity
        );
      }

      const count = events.length;
      const start = (page - 1) * limit;
      const pageItems = events.slice(start, start + limit);

      const isRegularView = (role === 'regular' || role === 'cashier');
      const results = pageItems.map(ev => {
        const base = {
          id: ev.id,
          name: ev.name,
          location: ev.location,
          startTime: ev.startTime,
          endTime: ev.endTime,
          capacity: ev.capacity ?? null,
          numGuests: ev._count?.guests ?? 0,
        };
        if (!isRegularView) {
          base.pointsRemain  = ev.pointsRemain;
          base.pointsAwarded = ev.pointsAwarded;
          base.published     = ev.published;
        }
        return base;
      });

      return res.status(200).json({ count, results });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async organizeEvent(req, res){
    try {
      let eid = parseInt(req.params.eventId, 10);

      if (isNaN(eid)) {
        return res.status(404).json({ message: "no such event" });
      }
      let { utorid } = req.body;

      let user = await userService.getUserByUtorid(utorid);
      if(user === null){
        return res.status(404).json({ message: "no such user of Utorid" });
      }

      let event = await eventsService.getEventById(eid);
      if(event === null){
        return res.status(404).json({ message: "no such event" });
      }

      if(new Date(event.endTime) < new Date()){
        return res.status(410).json({ message: "event has ended" });
      }

      for (let guest of event.guests) {
        if (guest.id === user.id) {
          return res.status(400).json({ 
            error: "User is already a guest of this event." 
          });
        }
      }

      await eventsService.addOrganizer(user.id, event.id);
      let updatedEvent = await eventsService.getEventById(eid);
      let { id, name, location, organizers } = updatedEvent;
      return res.status(201).json({ 
        id, name, location, organizers
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
  
  async kickOrganizer(req, res){
    try {
      let eid = parseInt(req.params.eventId, 10);
      let uid = parseInt(req.params.userId, 10);
      await eventsService.deleteOrganizer(uid, eid);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async deleteEvent(req,res){
    try {
      let eid = parseInt(req.params.eventId, 10);
      let event = await eventsService.getEventById(eid);
      if(Boolean(event.published) === true) {
        return res.status(400).json({ message: "event already published" });
      }
      await eventsService.deleteEventById(eid);
      return res.status(204).send();
    }
    catch(error){
      return res.status(400).json({ error: error.message });
    }
  },

  async getEvent(req,res){
    try {
      let eid = parseInt(req.params.eventId, 10);
      let event = await eventsService.getEventById(eid);
      if(event === null){
        return res.status(404).json({ message: "no such event" });
      }
      let isOrganizer = await eventsService.checkOrganizer(req.user.id,eid);
      if (isOrganizer || req.user.role === "manager" || req.user.role === "superuser") {
        const { id, name, description, location, startTime, endTime, capacity, 
          pointsRemain, pointsAwarded, published, organizers, guests
        } = event;
        return res.status(200).json({ id, name, description, location, startTime, endTime, capacity, 
        pointsRemain, pointsAwarded, published, organizers, guests});
      }


      if(Boolean(event.published) === false) {
        return res.status(404).json({ message: "event not found" });
      }
      const { id, name, description, location, startTime, endTime, capacity, organizers,numGuests
      } = event;
      return res.status(200).json({ id, name, description, location, startTime, endTime, capacity, 
        organizers, numGuests
      });
    }
    catch(error){
      return res.status(400).json({ error: error.message });
    }
  }
};

module.exports = eventController;