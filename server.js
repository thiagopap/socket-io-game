const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname + "public")));
app.set("views", path.join(__dirname, "public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.get("/", (req, res) => {
  res.render("index.html");
});

let players = [];
let fruits = [];

io.on("connection", socket => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("startGame", data => {
    let player = createPlayer(
      socket.id,
      data.name,
      data.avatar,
      20 * Math.floor(Math.random() * maxElementX),
      20 * Math.floor(Math.random() * maxElementY),
      0
    );

    players.push(player);

    socket.emit("createdPlayers", players);
    socket.broadcast.emit("updateGame", players);
    socket.emit("createdFruits", fruits);
  });

  socket.on("updatePlayer", data => {
    var currentPlayer = players.find(p => p.id === socket.id);
    currentPlayer.x = data.x;
    currentPlayer.y = data.y;
    currentPlayer.points = data.points;

    socket.broadcast.emit("updateGame", players);
  });

  socket.on("capturedFruit", fruit => {
    fruits = fruits.filter(function(f) {
      return !(f.x == fruit.x && f.y == fruit.y);
    });
  });

  setInterval(() => {
    socket.emit("createdFruits", fruits);
  }, 20);

  socket.on("disconnect", () => {
    players = players.filter(function(currentPlayer) {
      return currentPlayer.id !== socket.id;
    });
    socket.broadcast.emit("updateGame", players);
  });
});
///////////////////////////////////////////////////////////
const maxElementX = 780 / 20 + 1;
const maxElementY = 580 / 20 + 1;

var createPlayer = (id, name, avatar, x, y, points) => {
  return {
    id: id,
    name: name,
    avatar: avatar,
    x: x,
    y: y,
    points: points
  };
};

var createFruit = (avatar, x, y, points) => {
  return {
    avatar: avatar,
    x: x,
    y: y,
    points: points
  };
};

var generateRandomFruit = function() {
  let randomX = 20 * Math.floor(Math.random() * maxElementX);
  let randomY = 20 * Math.floor(Math.random() * maxElementY);

  var fruitExists = fruits.find(f => f.x == randomX && f.y == randomY);

  if (!fruitExists) {
    var fruit = createFruit("\ud83c\udf4e", randomX, randomY, 1);
    return fruit;
  } else {
    return generateRandomFruit();
  }
};

setInterval(() => {
  if (fruits.length < (800 / 20) * (600 / 20)) {
    var fruit = generateRandomFruit();
    if (fruit) {
      fruits.push(fruit);
    }
  }
}, 500);
///////////////////////////////////////////////////////////
server.listen(3000);
