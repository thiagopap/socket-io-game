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

  let fruit = generateRandomFruit();
  let player = createPlayer(
    socket.id,
    20 * Math.floor(Math.random() * maxElementX),
    20 * Math.floor(Math.random() * maxElementY),
    0
  );

  players.push(player);
  fruits.push(fruit);

  socket.emit("createdPlayers", players);
  socket.emit("createdFruits", fruits);
  socket.broadcast.emit("updateGame", players);
  socket.broadcast.emit("updatedFruits", fruits);

  socket.on("updatePlayer", data => {
    player.x = data.x;
    player.y = data.y;
    player.points = data.points;

    socket.broadcast.emit("updateGame", players);
  });

  socket.on("capturedFruit", data => {
    console.log("capturedFruit");
    var tempFruit = fruits.find(f => f.x === data.x && f.y === data.y);
    fruits.pop(tempFruit);
    socket.broadcast.emit("updatedFruits", fruits);
    socket.emit("createdFruits", fruits);
  });

  socket.on("disconnect", () => {
    var currentPlayer = players.find(p => p.name === socket.id);
    players.pop(currentPlayer);
    socket.broadcast.emit("updateGame", players);
  });

  setInterval(() => {
    var tempFruit = generateRandomFruit();
    fruits.push(tempFruit);
    socket.broadcast.emit("updatedFruits", fruits);
    socket.emit("createdFruits", fruits);
  }, 10000);
});
///////////////////////////////////////////////////////////
const maxElementX = 780 / 20 + 1;
const maxElementY = 580 / 20;

var createPlayer = (name, x, y, points) => {
  return {
    name: name,
    x: x,
    y: y,
    points: points
  };
};

var createFruit = (x, y, points) => {
  return {
    x: x,
    y: y,
    points: points
  };
};

var generateRandomFruit = function() {
  let randomX = 20 * Math.floor(Math.random() * maxElementX);
  let randomY = 20 * Math.floor(Math.random() * maxElementY);
  var fruit = createFruit(randomX, randomY, 1);
  return fruit;
};
///////////////////////////////////////////////////////////
server.listen(3000);
