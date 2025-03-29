const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors())

let broadcaster = null;

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("broadcaster", () => {
        broadcaster = socket.id;
        socket.broadcast.emit("broadcaster");
    });

    socket.on("offer", (data) => {
        socket.to(data.target).emit("offer", { offer: data.offer, sender: socket.id });
    });

    socket.on("answer", (data) => {
        socket.to(data.sender).emit("answer", data.answer);
    });

    socket.on("candidate", (data) => {
        socket.to(data.target).emit("candidate", data.candidate);
    });

    socket.on("disconnect", () => {
        if (socket.id === broadcaster) {
            io.emit("broadcaster-disconnected");
            broadcaster = null;
        }
    });
});

server.listen(3001, "0.0.0.0", () => console.log("Signaling server running on port 3001"));

