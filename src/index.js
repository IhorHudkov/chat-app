const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const Filter = require("bad-words");

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static("./public"));

io.on("connection", (socket) => {
  socket.emit("message", "Welcome!");
  socket.broadcast.emit("message", "A new user has joined!");

  socket.on("sendMessage", (message, cb) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return cb("Profanity is not allowed");
    }

    io.emit("message", message);
    cb();
  });

  socket.on("disconnect", () => {
    io.emit("message", "A user has left!");
  });

  socket.on("sendLocation", (coords, callback) => {
    io.emit(
      "message",
      `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
    );
    callback()
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
