const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const Filter = require("bad-words");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

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
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );
    callback();
  });

  socket.on("sendMessage", (message, cb) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return cb("Profanity is not allowed");
    }

    const user = getUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", generateMessage(user.username, message));
    }

    cb();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
    }
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "locationMessage",
        generateLocationMessage(
          user.username,
          `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        )
      );
    }
    callback();
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
