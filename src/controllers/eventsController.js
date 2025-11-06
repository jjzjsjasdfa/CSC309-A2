const eventsService = require("../services/eventsService.js");
const userService = require("../services/userService.js");
const { Prisma, PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const eventController = {
  async register(req, res) {
    try {
      const { name: n, description: d, location: l, startTime: sT, endTime: eT, points: p, capacity: c} = req.body;
      const newEvent = await eventsService.registerEvent(n,d,l,sT,eT,p,c);
      const { id, name, description, location, startTime, endTime, capacity, pointsRemain, pointsAwarded,published,
        organizers,guests
       } = newEvent;

      return res.status(201).json({ id, name, description, location, startTime, endTime, capacity, pointsRemain, 
        pointsAwarded, published, organizers, guests});
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },

  async getEvents(req, res){
    try {
    let page, limit;
    let where = {};
    const present = new Date();

    //let postPublished = (req.user.role === "manager" || req.user.role === "superuser")

    for(const key in req.query){
      switch(key){
        case "name":
          where[key] = req.query[key];
          break;
        case "location":
          where[key] = req.query[key];
          break;
        case "page":
          page = parseInt(req.query[key], 10);
          break;
        case "limit":
          limit = parseInt(req.query[key], 10);
          break;
        case "started":
          if (req.query[key] === "true") where.startTime = { lte: present };
          else if (req.query[key] === "false") where.startTime = { gt: present };
          break;
        case "ended":
          if (req.query[key] === "true") where.endTime = { lte: present };
          else if (req.query[key] === "false") where.endTime = { gt: present };
          break;
          /*
        case "published":
          if (postPublished) {
            where.published = (req.query[key] === 'true');
          }
          break;*/
      }
    }

    if(req.user.role === "regular"){
      where.published = "true";
    }
    

    if(page === undefined){
      page = 1;
    }
    if(limit === undefined){
      limit = 10;
    }
    if(page < 1 || limit < 1){
      return res.status(400).json({ error: "page and limit must be positive integers" });
    }



    let events = await eventsService.getEvents(where);

    if (req.query.showFull !== 'true') {
      events = events.filter(event => event.capacity === null || event.numGuests < event.capacity);
    }

    const count = events.length;
    if(!events){
      return res.status(200).json({ message: "no events found" });
    }
    const skip = (page - 1) * limit;
    events = await eventsService.getEventsWithSkipAndLimit(where, skip, limit);
    if(!events){
      return res.status(200).json({ message: "no events in this page" });
    }

    /*
    const results = postPublished ? events.map(
      ({id, name, location, startTime, endTime, capacity, numGuests, published}) =>
        ({id, name, location, startTime, endTime, capacity, numGuests, published}
      )
    ) :events.map(
      ({id, name, location, startTime, endTime, capacity, numGuests}) =>
        ({id, name, location, startTime, endTime, capacity, numGuests}
      )
    );*/

    const results = events.map(
      ({id, name, location, startTime, endTime, capacity, numGuests}) =>
        ({id, name, location, startTime, endTime, capacity, numGuests}
      )
    );

    return res.status(200).json({
      count: count,
      results: results,
    });
  }

  catch (error) {
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