const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static("./public"));

io.on("connection", (socket) => {
  
  socket.on("join", ({ username, room }) => {
    socket.join(room);
    socket.emit("message", generateMessage("Welcome!"));
    socket.broadcast.to(room).emit("message", generateMessage(`${username} has joined!`));
  })

  socket.on("sendMessage", (message, cb) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return cb("Profanity is not allowed");
    }

    io.emit("message", generateMessage(message));
    cb();
  });

  socket.on("disconnect", () => {
    io.emit("message", generateMessage("A user has left!"));
  });

  socket.on("sendLocation", (coords, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
