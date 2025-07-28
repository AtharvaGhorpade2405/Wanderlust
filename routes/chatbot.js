const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatbot");

router.post("/chat", chatController.sendMessage);

module.exports = router;
