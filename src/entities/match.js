const matchDuration = 61;
const restartMatchDuration = 10;
const playersAmount = 11;
const boardWidth = 800;
const boardHeight = 600;
const componentWidth = 20;
const componentHeight = 20;
const maxComponentX = (boardWidth - componentWidth) / componentWidth + 1;
const maxComponentY = (boardHeight - componentHeight) / componentHeight + 1;

class Match {
  players = [];
  fruits = [];

  constructor() {}

  get matchDuration() {
    return matchDuration;
  }
  get restartMatchDuration() {
    return restartMatchDuration;
  }
  get playersAmount() {
    return playersAmount;
  }
  get boardWidth() {
    return boardWidth;
  }
  get boardHeight() {
    return boardHeight;
  }
  get componentWidth() {
    return componentWidth;
  }
  get componentHeight() {
    return componentHeight;
  }
  get maxComponentX() {
    return maxComponentX;
  }
  get maxComponentY() {
    return maxComponentY;
  }
}

module.exports = Match;
