const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");

const { authenticateToken, authorization,organizerAuthorization, validatePayload, verifyUserId, debug } = require('../middleware/middleware');

router.route("/")
.post(
    authenticateToken,            
    authorization(["manager", "superuser"]),  
    validatePayload({ 
        required: ["name", "description", "location", "startTime", "endTime", "points"],
        optional: ["capacity"]
    }, "body"),
    eventsController.register
).get(
    authenticateToken,            
    authorization(["regular","cashier","manager","superuser"]),  
    validatePayload({ 
        optional: ["name", "location", "started", "ended", "showFull", "page", "limit", "published"]
    }, "query"),
    eventsController.getEvents
)


router.route("/:eventId/organizers")
.post(
    authenticateToken,            
    authorization(["manager", "superuser"]),  
    validatePayload({ 
        required: ["utorid"],
    }, "body"),
    eventsController.organizeEvent
)

router.route("/:eventId/organizers/:userId")
.delete(
    authenticateToken,            
    authorization(["manager", "superuser"]),
    eventsController.kickOrganizer
)

router.route("/:eventId")
    .delete(
    authenticateToken, 
    authorization(["manager", "superuser"]),
    eventsController.deleteEvent)
    .get(authenticateToken, 
    authorization(["regular","cashier","manager", "superuser"]),
    eventsController.getEvent)

    
    

module.exports = router;