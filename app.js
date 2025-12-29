const express = require("express");
const app = express();


const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const markers = {};

io.on("connection", (socket) => {
    socket.emit("existing-users", markers);
    console.log("a user connected");

    socket.on("send-location", (data) => {
        // Merge with existing data to preserve name if not present in new packet
        if (markers[socket.id]) {
            markers[socket.id] = { ...markers[socket.id], ...data };
        } else {
            markers[socket.id] = { ...data, id: socket.id };
        }
        io.emit("receive-location", { id: socket.id, ...markers[socket.id] });
    });

    socket.on("disconnect", () => {
        delete markers[socket.id];
        io.emit("user-disconnected", socket.id);
    });
});

app.get("/", (req, res) => {
    res.render("index");
})

server.listen(3000)