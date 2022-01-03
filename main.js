function mainLoad(){
  try {
    initPositions();
    drawBoard();
    document.getElementById("mainCanvas").addEventListener('mousemove', mouseOverCan, false);
    document.getElementById("mainCanvas").addEventListener('click', mouseClickCan, false);
    resumeGame();
  }
  catch(err) {
    document.body.innerHTML = err.message;
  }
};

//Board layout:
var lineDistance = 65;
var borderDistance = 50;
var boardSize = 500;
var circleRadius = 15;
var coinRadius = 20;

// Board positions:
var POSITIONS = [];

//Game parameters:
var numberCoins = 9;

//Player coins:
var playerCoins = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

//Player types:
//  0:  Human
//  1:  MinMax
//  2:  Neural
var playerTypes = [0, 0];

//What to do with a mouse move:
//  0: Nothing
//  1: handleMouseMovePut
//  2: handleMouseMovePick
//  3: handleMouseMoveSlide
var whatMouseMove = 0;

//What to do with mouse click:
//  0: Nothing
//  1: handleMouseClickPut
//  2: handleMouseClickPick
//  3: handleMouseClickSlide
var whatMouseClick = 0;

function initPositions() {
  var bd = borderDistance;
  for (var i = 0; i < 3; i++) {
    for (var yy = 0; yy < 3; yy++) {
      for (var xx = 0; xx < 3; xx++) {
        if ((xx == 1) && (yy == 1)) {
          continue;
        }
        var ld = (boardSize - 2*bd)/2;
        var xi = bd + xx*ld;
        var yi = bd + yy*ld;
        POSITIONS.push([xi, yi]);
      }
    }
    bd = bd + lineDistance;
  }
}

function drawBoard() {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  ctx.clearRect(0, 0, can.width, can.height);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.beginPath();
  //Outer:
  ctx.moveTo(50, 50);
  ctx.lineTo(450, 50);
  ctx.lineTo(450, 450);
  ctx.lineTo(50, 450);
  ctx.lineTo(50, 50);
  //Middle:
  ctx.moveTo(115, 115);
  ctx.lineTo(385, 115);
  ctx.lineTo(385, 385);
  ctx.lineTo(115, 385);
  ctx.lineTo(115, 115);
  //Inner:
  ctx.moveTo(180, 180);
  ctx.lineTo(320, 180);
  ctx.lineTo(320, 320);
  ctx.lineTo(180, 320);
  ctx.lineTo(180, 180);
  //Connecting lines:
  ctx.moveTo(250, 50);
  ctx.lineTo(250, 180);
  ctx.moveTo(450, 250);
  ctx.lineTo(320, 250);
  ctx.moveTo(250, 450);
  ctx.lineTo(250, 320);
  ctx.moveTo(50, 250);
  ctx.lineTo(180, 250);
  ctx.stroke();
  //Circles:
  ctx.fillStyle = '#000000';
  for (var pos = 0; pos < POSITIONS.length; pos++) {
    ctx.beginPath();
    ctx.arc(POSITIONS[pos][0], POSITIONS[pos][1], circleRadius, 0, 2 * Math.PI, false);
    ctx.fill();
  }
}

var gameState = 0;

var activeCoin;
var activePlayer = 1;
var coinCnt = 0;
var winner = 0;

function resumeGame() {
  writeLog("GameState: " + gameState);
  switch (gameState) {
    case 0: //Player puts coin
      getPlayerCoin();
      gameState = 1;
      break;
    case 1: //Check coin validity
      var coinValid = checkCoinValid(activeCoin);
      writeLog("Coin valid: " + coinValid);
      if (coinValid) {
        drawCoin(activeCoin, activePlayer);
        playerCoins[activeCoin] = activePlayer;
        gameState = 2;
      }
      else {
        gameState = 0;
      }
      resumeGame();
      break;
    case 2: //Check mills
      var mill = checkMill(activeCoin);
      writeLog("Inside mill: " + mill);
      if (mill) {
        gameState = 3;
      }
      else {
        gameState = 5;
      }
      resumeGame();
      break;
    case 3: //Take coin after mill
      playerTakeCoin();
      gameState = 4;
      break;
    case 4: //Check coin validity
      var coinValid = checkTakenCoinValid(activePlayer, activeCoin);
      writeLog("Taken coin valid: " + coinValid);
      if (coinValid) {
        playerCoins[activeCoin] = 0;
        drawBoard();
        drawCoins();
        gameState = 5;
      }
      else {
        gameState = 3;
      }
      resumeGame();
      break;
    case 5: //Handle players until end of put phase
      coinCnt++;
      if (coinCnt >= 2*numberCoins) {
        gameState = 6;
      }
      else {
        gameState = 0;
      }
      activePlayer = -activePlayer;
      resumeGame();
      break;
    case 6: //Sliding phase begins
      getPlayerSlide();
      gameState = 7;
      break;
    case 7:
      var slideValid = checkSlideValid(activeCoin);
      writeLog('Slide valid: ' + slideValid);
      if (slideValid) {
        playerCoins[activeCoin[0]] = 0;
        playerCoins[activeCoin[1]] = activePlayer;
        drawBoard();
        drawCoins();
        gameState = 8;
      }
      else {
        gameState = 6;
      }
      resumeGame();
      break;
    case 8:
      var mill = checkMill(activeCoin[1]);
      writeLog("Inside mill: " + mill);
      if (mill) {
        gameState = 9;
      }
      else {
        gameState = 11;
      }
      resumeGame();
      break;
    case 9:
      playerTakeCoin();
      gameState = 10;
      break;
    case 10:
      var coinValid = checkTakenCoinValid(activePlayer, activeCoin);
      writeLog("Taken coin valid: " + coinValid);
      if (coinValid) {
        playerCoins[activeCoin] = 0;
        drawBoard();
        drawCoins();
        gameState = 11;
      }
      else {
        gameState = 9;
      }
      resumeGame();
      break;
    case 11:
      //Check if final phase can start or the game has ended in a draw.
      if (noSlide(-activePlayer)) {
        writeLog("No slide possible")
        winner = activePlayer;
        gameState = 100;
      }
      else if (getNumberCoins(-activePlayer) < 3) {
        writeLog("Not enough coins")
        winner = activePlayer;
        gameState = 100;
      }
      else {
        gameState = 6;
      }
      activePlayer = -activePlayer;
      resumeGame();
      break;
    case 100:
      //Final gameState, winning player is determined.

      break;
  }
}

//Determines if the given player has no legal slide move possible.
function noSlide(player) {
  var slideableCoins = getSlideable(player);
  if (slideableCoins.length == 0) {
    return true;
  }
  return false;
}

//Return the number of coins on the board for the given player.
function getNumberCoins(player) {
  var result = 0;
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] == player) {
      result++;
    }
  }
  return result;
}

//Check if slide move was valid for the current active player.
function checkSlideValid(slide) {
  if (playerCoins[slide[0]] != activePlayer) {
    return false;
  }
  if (playerCoins[slide[1]] != 0) {
    return false;
  }
  if (getNumberCoins(activePlayer) < 4) {
    return true;
  }
  var neig = getNeighbours(slide[0]);
  var contains = false;
  for (var i = 0; i < neig.length; i++) {
    if (neig[i] == slide[1]) {
      contains = true;
      break;
    }
  }
  return contains;
}

//Get a coin from the player.
function getPlayerCoin() {
  switch (playerTypes[(activePlayer+1)/2]) {
    case 0:
      getHumanCoin();
      break;
    case 1:

      break;
    case 2:

      break;
    default:

  }
}

//Get a slide move from the player.
function getPlayerSlide() {
  if (getNumberCoins(activePlayer) >= 4) {
    switch (playerTypes[(activePlayer+1)/2]) {
      case 0:
        getHumanSlide();
        break;
      case 1:

        break;
      case 2:

        break;
      default:

    }
  }
  else {
    switch (playerTypes[(activePlayer+1)/2]) {
      case 0:
        getHumanFly();
        break;
      case 1:

        break;
      case 2:

        break;
      default:

    }
  }
}

//Check if the given coin is on an empty position.
function checkCoinValid(coin) {
  return playerCoins[coin] == 0;
}

//Check if the given coin is part of a mill.
function checkMill(coin) {
  var mils = getMils(coin);
  for (var i = 0; i < mils.length; i++) {
    if ((playerCoins[mils[i][0]] == playerCoins[mils[i][1]]) && (playerCoins[mils[i][2]] == playerCoins[mils[i][1]])) {
      return true;
    }
  }
  return false;
}

//Ask the player to take a coin from the other player.
function playerTakeCoin() {
  switch (playerTypes[(activePlayer+1)/2]) {
    case 0:
      getHumanTakeCoin();
      break;
    case 1:

      break;
    case 2:

      break;
    default:

  }
}
 //Check if the coin taken is valid.
function checkTakenCoinValid(player, coin) {
  return playerCoins[coin] == -player;
}

//Convert coin number (0-23) to a board coordinate.
function coin2Pos(coin) {
  return POSITIONS[coin];
}

//Mouse is clicked, execute correct method.
function mouseClickCan(evt) {
  var can = document.getElementById("mainCanvas");
  var rect = can.getBoundingClientRect();
  var x = evt.clientX - rect.left;
  var y = evt.clientY - rect.top;
  switch (whatMouseClick) {
    case 0:
      return;
      break;
    case 1:
      handleMouseClickPut(x,y);
      break;
    case 2:
      handleMouseClickPick(x,y);
      break;
    case 3:
      handleMouseClickSlide(x,y);
    default:
  }
}

//Mouse moves over the canvas, execute correct method.
function mouseOverCan(evt) {
  var can = document.getElementById("mainCanvas");
  var rect = can.getBoundingClientRect();
  var x = evt.clientX - rect.left;
  var y = evt.clientY - rect.top;
  switch (whatMouseMove) {
    case 0:
      return;
      break;
    case 1:
      handleMouseMovePut(x,y);
      break;
    case 2:
      handleMouseMovePick(x,y);
      break;
    case 3:
      handleMouseMoveSlide(x,y);
      break;
    default:
  }
}

function drawCoin(coin, player) {
  if (player == 0) {
    return;
  }
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  ctx.lineWidth = 3;
  if (player == 1) {
    ctx.fillStyle = '#C68860';
    ctx.strokeStyle = '#9C6744';
  }
  else {
    ctx.fillStyle = '#FEF9E7';
    ctx.strokeStyle = '#F9E79F';
  }
  ctx.beginPath();
  ctx.arc(coin2Pos(coin)[0], coin2Pos(coin)[1], coinRadius, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.stroke();
}

//Generate a list of pickable positions for the active player.
function getPickablePos() {
  var result = [];
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] == -activePlayer) {
      var inMil = false;
      var mils = getMils(i);
      for (var j = 0; j < mils.length; j++) {
        if ((playerCoins[mils[j][0]] == playerCoins[mils[j][1]]) && (playerCoins[mils[j][2]] == playerCoins[mils[j][1]])) {
          inMil = true;
        }
      }
      if (!inMil) {
        result.push(i);
      }
    }
  }
  if (result.length == 0) {
    for (var i = 0; i < playerCoins.length; i++) {
      if (playerCoins[i] == -activePlayer) {
        result.push(i);
      }
    }
  }
  return result;
}

//Generate a list of mill positions that this coin is part of.
function getMils(coin) {
  var ring = (coin-coin%8)/8;
  var ringPos = coin-8*ring;
  var result = [];
  if ((ringPos == 0) || (ringPos == 2) || (ringPos == 5) || (ringPos == 7)) {
    //Corner
    switch (ringPos) {
      case 0:
        return [[0+ring*8, 1+ring*8, 2+ring*8], [0+ring*8, 3+ring*8, 5+ring*8]];
        break;
      case 2:
        return [[0+ring*8, 1+ring*8, 2+ring*8], [2+ring*8, 4+ring*8, 7+ring*8]];
        break;
      case 5:
        return [[5+ring*8, 6+ring*8, 7+ring*8], [0+ring*8, 3+ring*8, 5+ring*8]];
        break;
      case 7:
        return [[5+ring*8, 6+ring*8, 7+ring*8], [2+ring*8, 4+ring*8, 7+ring*8]];
        break;
    }
  }
  else {
    //Middle
    switch (ringPos) {
      case 1:
        return [[0+ring*8, 1+ring*8, 2+ring*8], [ringPos, ringPos+8, ringPos+16]];
        break;
      case 3:
        return [[0+ring*8, 3+ring*8, 5+ring*8], [ringPos, ringPos+8, ringPos+16]];
        break;
      case 4:
        return [[2+ring*8, 4+ring*8, 7+ring*8], [ringPos, ringPos+8, ringPos+16]];
        break;
      case 6:
        return [[5+ring*8, 6+ring*8, 7+ring*8], [ringPos, ringPos+8, ringPos+16]];
        break;
    }
  }
}

function drawCoins() {
  for (var i = 0; i < playerCoins.length; i++) {
    drawCoin(i, playerCoins[i]);
  }
}

//Write a new line to the left pane.
function writeLog(log) {
  var pane = document.getElementById("rightCoinHolder");
  pane.innerHTML = pane.innerHTML + log + "<br>";
}

//Return all neighbour positions for the given position.
function getNeighbours(pos) {
  var mills = getMils(pos);
  var result = [];
  for (var i = 0; i < mills.length; i++) {
    var j = 0;
    while (j < 3) {
      if (mills[i][j] == pos) {
        break;
      }
      j++;
    }
    switch (j) {
      case 0:
        result.push(mills[i][1]);
        break;
      case 1:
        result.push(mills[i][0]);
        result.push(mills[i][2]);
        break;
      case 2:
        result.push(mills[i][1]);
        break;
    }
  }
  return result;
}

//Get all slideable coins for the given player, takes into account the flying phase.
function getSlideable(player) {
  var slideable = [];
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] == player) {
      if (getNumberCoins(player) < 4) {
        slideable.push(i);
        continue;
      }
      var neig = getNeighbours(i);
      var emptyNeig = false;
      for (var j = 0; j < neig.length; j++) {
        if (playerCoins[neig[j]] == 0) {
          emptyNeig = true;
          break;
        }
      }
      if (emptyNeig) {
        slideable.push(i);
      }
    }
  }
  return slideable;
}

//Generate a list of free neighbouring positions for the given position, takes into account the flying phase for the current active player.
function getFreeNeighbours(pos) {
  var result = [];
  if (getNumberCoins(activePlayer) < 4) {
    for (var i = 0; i < playerCoins.length; i++) {
      if (playerCoins[i] == 0) {
        result.push(i);
      }
    }
    return result;
  }
  var neig = getNeighbours(pos);
  for (var i = 0; i < neig.length; i++) {
    if (playerCoins[neig[i]] == 0) {
      result.push(neig[i]);
    }
  }
  return result;
}
