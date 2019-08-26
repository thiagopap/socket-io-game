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

  let player = createPlayer(
    socket.id,
    20 * Math.floor(Math.random() * maxElementX),
    20 * Math.floor(Math.random() * maxElementY),
    0
  );

  players.push(player);

  socket.emit("createdPlayers", players);
  socket.broadcast.emit("createdFruits", players);
  socket.emit("createdFruits", fruits);

  socket.on("updatePlayer", data => {
    player.x = data.x;
    player.y = data.y;
    player.points = data.points;

    socket.broadcast.emit("updateGame", players);
  });

  socket.on("capturedFruit", fruit => {
    fruits.pop(fruits.find(f => f.x === fruit.x && f.y === fruit.y));
  });

  setInterval(() => { 
    socket.broadcast.emit("createdFruits", fruits);    
    socket.emit("createdFruits", fruits);
  }, 100);

  socket.on("disconnect", () => {
    var currentPlayer = players.find(p => p.name === socket.id);
    players.pop(currentPlayer);
    socket.broadcast.emit("updateGame", players);
  });
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

  var fruitExists = fruits.find(f => f.x === randomX && f.y === randomY);

  if (!fruitExists) {
    var fruit = createFruit(randomX, randomY, 1);
    return fruit;
  }

  return null;
};

setInterval(() => {
  var fruit = generateRandomFruit();
  if (fruit) {
    fruits.push(fruit);
  } else {
    fruit = generateRandomFruit();
    fruits.push(fruit);
  }  
}, 10000);
///////////////////////////////////////////////////////////
server.listen(3000);
