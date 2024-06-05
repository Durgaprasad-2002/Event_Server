const express = require("express");
const router = express.Router();

const {
  GetAllEvents,
  CreateEvent,
  UpdateEvent,
  DeleteEvent,
  AuthCallback,
} = require("../controllers/eventController");

router.get("/", GetAllEvents);

router.post("/", CreateEvent);

router.put("/:id", UpdateEvent);

router.delete("/", DeleteEvent);

router.get("/oauth2callback", AuthCallback);

module.exports = router;
