const http = require("http");
const socketIo = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Create a basic HTTP server
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = socketIo(server, {
    transports: ["websocket", "polling"],
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    },
});

// Store connected users
const users = {};

// Set up a connection event
io.on("connection", (socket) => {
    console.log("A user connected");

    // Add user to users list when they provide their userId
    socket.on("register", (userId) => {
        console.log(`User registered: ${userId}`);
        users[userId] = socket.id;
        // Emit the user status
        io.emit("user-status", { userId: userId, isActive: true });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        for (const userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                // Emit the user status
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
        console.log(`Sending notification to user ${toUserId} at socket ${toSocketId}`);
        io.to(toSocketId).emit("notification", message);
        res.status(200).send("Notification sent");
    } else {
        console.log(`User ${toUserId} is not connected`);
        res.status(404).send("User not connected");
    }
});

// Endpoint to handle send-collaboration-notification
app.post("/send-collaboration-notification", (req, res) => {
    const { toUserId, message } = req.body;
    console.log(`Received send-collaboration-notification for user ${toUserId} with message: ${message}`);
    const toSocketId = users[toUserId];

    if (toSocketId) {
        console.log(`Sending collaboration notification to user ${toUserId} at socket ${toSocketId}`);
        io.to(toSocketId).emit("collaboration-notification", message);
        res.status(200).send("Collaboration notification sent");
    } else {
        console.log(`User ${toUserId} is not connected`);
        res.status(404).send("User not connected");
    }
});

// Endpoint to handle new messages
app.post("/send-message", (req, res) => {
    const { toUserId, message } = req.body;
    console.log(`Received message for user ${toUserId} with message: ${message}`);
    const toSocketId = users[toUserId];

    if (toSocketId) {
        console.log(`Sending message to user ${toUserId} at socket ${toSocketId}`);
        io.to(toSocketId).emit("message", message);
        res.status(200).send("Message sent");
    } else {
        console.log(`User ${toUserId} is not connected`);
        res.status(404).send("User not connected");
    }
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
