const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");

const { authenticateToken, authorization, validatePayload, verifyUserId, debug } = require('../middleware/middleware');

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
    

module.exports = router;