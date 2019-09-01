const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

var { Match, Player, Fruit } = require("./src/entities");

///////////////////////////////////////////////////////////
//SERVER CONFIGURATIONS
///////////////////////////////////////////////////////////
app.use(express.static(path.join(__dirname + "public")));
app.set("views", path.join(__dirname, "public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.get("/", (req, res) => {
  res.render("index.html");
});

server.listen(3000);
///////////////////////////////////////////////////////////
//GLOBAL VARIABLES
///////////////////////////////////////////////////////////
var match = new Match();
var matchCurrentDuration = match.matchDuration;
var matchRestartCountDown = match.restartMatchDuration;

var matchRestarted = false;
///////////////////////////////////////////////////////////
//SOCKET IO
///////////////////////////////////////////////////////////
io.on("connection", socket => {
  console.log(`Client connected: ${socket.id}`);

  if (match.players.length >= match.playersAmount) {
    console.log("Maximum amount of players exceeded.");
    socket.disconnect();
  }

  socket.on("startMatch", playerData => {
    let player = createRandomPlayer(socket.id, playerData);

    match.players.push(player);

    match.players.sort(function(a, b) {
      return b.points - a.points;
    });

    socket.emit("createdPlayers", match.players);
    socket.broadcast.emit("updateMatch", match.players);
    socket.emit("createdFruits", match.fruits);
  });

  socket.on("updatePlayer", data => {
    var currentPlayer = match.players.find(p => p.id === socket.id);
    currentPlayer.x = data.x;
    currentPlayer.y = data.y;
    currentPlayer.points = data.points;

    match.players.sort(function(a, b) {
      return b.points - a.points;
    });

    socket.broadcast.emit("updateMatch", match.players);
  });

  socket.on("capturedFruit", fruit => {
    match.fruits = match.fruits.filter(function(f) {
      return !(f.x == fruit.x && f.y == fruit.y);
    });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    match.players = match.players.filter(function(currentPlayer) {
      return currentPlayer.id !== socket.id;
    });

    match.players.sort(function(a, b) {
      return b.points - a.points;
    });

    clearInterval(matchCurrentDurationInterval);
    clearInterval(matchRestartInterval);
    socket.broadcast.emit("updateMatch", match.players);
  });

  var matchCurrentDurationInterval = setInterval(
    matchCurrentDurationProcess,
    1000
  );

  function matchCurrentDurationProcess() {
    if (matchCurrentDuration <= 0) {
      clearInterval(matchCurrentDurationInterval);
      socket.emit("endMatch", matchCurrentDuration);
    } else {
      socket.emit("matchCurrentDuration", matchCurrentDuration);
    }
  }

  var matchRestartInterval = setInterval(matchRestartProcess, 1000);

  function matchRestartProcess() {
    // console.log(
    //   "matchRestartProcess",
    //   matchCurrentDuration,
    //   matchRestartCountDown,
    //   socket.id
    // );

    if (matchCurrentDuration <= 0) {
      if (matchRestartCountDown >= 0) {
        socket.emit("restartMatchCountDown", matchRestartCountDown);
      }
    }
    if (
      matchCurrentDuration === match.matchDuration &&
      matchRestarted === true
    ) {
      matchCurrentDurationInterval = null;
      matchCurrentDurationInterval = setInterval(
        matchCurrentDurationProcess,
        1000
      );

      socket.emit("updateMatch", match.players);
      socket.emit("createdFruits", match.fruits);
    }
  }

  setInterval(() => {
    if (matchCurrentDuration <= 0) {
      match.fruits = [];
    }
    socket.emit("createdFruits", match.fruits);
  }, 20);
});
///////////////////////////////////////////////////////////
//ENTITIES METHODS
///////////////////////////////////////////////////////////
var createRandomPlayer = function(id, playerData) {
  let randomX =
    match.componentWidth * Math.floor(Math.random() * match.maxComponentX);
  let randomY =
    match.componentHeight * Math.floor(Math.random() * match.maxComponentY);

  var playerExists = match.players.find(p => p.x == randomX && p.y == randomY);

  if (!playerExists) {
    var player = new Player(
      id,
      playerData.name,
      playerData.avatar,
      randomX,
      randomY,
      0
    );
    return player;
  } else {
    return createRandomPlayer(id, playerData);
  }
};

var createRandomFruit = function() {
  let randomX =
    match.componentWidth * Math.floor(Math.random() * match.maxComponentX);
  let randomY =
    match.componentHeight * Math.floor(Math.random() * match.maxComponentY);

  var fruitExists = match.fruits.find(f => f.x == randomX && f.y == randomY);

  if (!fruitExists) {
    var fruit = new Fruit("\ud83c\udf4e", randomX, randomY, 1);
    return fruit;
  } else {
    return createRandomFruit();
  }
};

var fruitCreationProcess = setInterval(() => {
  if (
    match.fruits.length <
    (match.boardWidth / match.componentWidth) *
      (match.boardHeight / match.componentHeight)
  ) {
    var fruit = createRandomFruit();
    if (fruit) {
      match.fruits.push(fruit);
    }
  }
}, 3000);

var matchInterval = setInterval(matchIntervalProcess, 1000);

function matchIntervalProcess() {
  if (matchCurrentDuration > 0) {
    matchRestarted = false;
  }
  matchCurrentDuration -= 1;
}

function restartMatch() {
  for (player of match.players) {
    player.points = 0;
  }
  matchCurrentDuration = match.matchDuration;
  matchRestartCountDown = match.restartMatchDuration;
  match.fruits = [];

  matchRestarted = true;
}

setInterval(matchRestartGlobalCountDownProcess, 1000);

function matchRestartGlobalCountDownProcess() {
  if (matchCurrentDuration < 0) {
    matchRestartCountDown -= 1;
    if (matchRestartCountDown < 0) {
      matchRestartCountDown = 0;
      restartMatch();
    }
  }
}
///////////////////////////////////////////////////////////
