const http = require("http");
const socketIo = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Create an HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = socketIo(server, {
    transports: ["websocket", "polling"],
    cors: {
        origin: "*", // Adjust this line to your requirements
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    },
});

// Store connected users
const users = {};

// Set up a connection event
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("register", (userId) => {
        console.log(`User registered: ${userId}`);
        users[userId] = socket.id;
        io.emit("user-status", { userId: userId, isActive: true });
    });

    socket.on("disconnect", () => {
        for (const userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                io.emit("user-status", { userId: userId, isActive: false });
                break;
            }
        }
        console.log("A user disconnected");
    });
});

// Endpoint to handle send-notification
app.post("/send-notification", (req, res) => {
    const { toUserId, message } = req.body;
    console.log(`Received send-notification for user ${toUserId} with message: ${message}`);
    const toSocketId = users[toUserId];

    if (toSocketId) {
        io.to(toSocketId).emit("notification", message);
        res.status(200).send("Notification sent");
    } else {
        res.status(404).send("User not connected");
    }
});

// Endpoint to handle send-collaboration-notification
app.post("/send-collaboration-notification", (req, res) => {
    const { toUserId, message } = req.body;
    const toSocketId = users[toUserId];

    if (toSocketId) {
        io.to(toSocketId).emit("collaboration-notification", message);
        res.status(200).send("Collaboration notification sent");
    } else {
        res.status(404).send("User not connected");
    }
});

// Endpoint to handle new messages
app.post("/send-message", (req, res) => {
    const { toUserId, message } = req.body;
    const toSocketId = users[toUserId];

    if (toSocketId) {
        io.to(toSocketId).emit("message", message);
        res.status(200).send("Message sent");
    } else {
        res.status(404).send("User not connected");
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
