var pickableColor = '#2ECC71';
var pickedColor = '#5DADE2';
var selectedColor = '#E74C3C';

function getHumanCoin() {
  lightFreePos();
  //Wait for user input...
  whatMouseMove = 1;
  whatMouseClick = 1;
}

function lightFreePos() {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  ctx.fillStyle = '#2ECC71';
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] == 0) {
      var pos = coin2Pos(i);
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], circleRadius, 0, 2 * Math.PI, false);
      ctx.fill();
    }
  }
}

function handleMouseMovePut(x, y) {
  // var can = document.getElementById("mainCanvas");
  // var ctx = can.getContext("2d");
  document.getElementById("leftCoinHolder").innerHTML = x + " " + y;
  var paintedCoins = [];
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] == 0) {
      paintedCoins.push(i);
    }
  }
  paintMouseCoins(x, y, paintedCoins, pickedColor, pickableColor);
}

//Paint the given coins in the right color. If the mouse position is close enough, the coin position will be colored in pickedColor, pickableColor otherwise.
function paintMouseCoins(x, y, coins, color1, color2) {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  for (var i = 0; i < coins.length; i++) {
    var coin = coins[i];
    var dist = Math.sqrt(Math.pow(x-coin2Pos(coin)[0], 2)+Math.pow(y-coin2Pos(coin)[1], 2));
    if (dist <= circleRadius) {
      ctx.fillStyle = color1;
    }
    else {
      ctx.fillStyle = color2;
    }
    ctx.beginPath();
    ctx.arc(coin2Pos(coin)[0], coin2Pos(coin)[1], circleRadius, 0, 2 * Math.PI, false);
    ctx.fill();
  }
}

function handleMouseClickPut(x, y) {
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] != 0) {
      continue;
    }
    var dist = Math.sqrt(Math.pow(x-coin2Pos(i)[0], 2)+Math.pow(y-coin2Pos(i)[1], 2));
    if (dist <= circleRadius) {
      activeCoin = i;
      whatMouseMove = 0;
      whatMouseClick = 0;
      paintEmptyBlack();
      break;
    }
  }
  resumeGame();
}

function paintEmptyBlack() {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  ctx.fillStyle = '#000000';
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] == 0) {
      ctx.beginPath();
      ctx.arc(POSITIONS[i][0], POSITIONS[i][1], circleRadius, 0, 2 * Math.PI, false);
      ctx.fill();
    }
  }
}

function getHumanTakeCoin() {
  lightPickPos();
  whatMouseMove = 2;
  whatMouseClick = 2;
}

//Light up positions that can be picked initially.
function lightPickPos() {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  ctx.fillStyle = pickableColor;
  var pickablePos = getPickablePos();
  for (var i = 0; i < pickablePos.length; i++) {
    ctx.beginPath();
    ctx.arc(POSITIONS[pickablePos[i]][0], POSITIONS[pickablePos[i]][1], circleRadius, 0, 2 * Math.PI, false);
    ctx.fill();
  }
}

//Light up positions that can be picked.
function handleMouseMovePick(x, y) {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  document.getElementById("leftCoinHolder").innerHTML = x + " " + y;
  var pickablePos = getPickablePos();
  for (var i = 0; i < pickablePos.length; i++) {
    var dist = Math.sqrt(Math.pow(x-coin2Pos(pickablePos[i])[0], 2)+Math.pow(y-coin2Pos(pickablePos[i])[1], 2));
    if (dist <= circleRadius) {
      ctx.fillStyle = pickedColor;
    }
    else {
      ctx.fillStyle = pickableColor;
    }
    ctx.beginPath();
    ctx.arc(coin2Pos(pickablePos[i])[0], coin2Pos(pickablePos[i])[1], circleRadius, 0, 2 * Math.PI, false);
    ctx.fill();
  }
}

function handleMouseClickPick(x, y) {
  var pickablePos = getPickablePos();
  for (var i = 0; i < pickablePos.length; i++) {
    var dist = Math.sqrt(Math.pow(x-coin2Pos(pickablePos[i])[0], 2)+Math.pow(y-coin2Pos(pickablePos[i])[1], 2));
    if (dist <= circleRadius) {
      activeCoin = pickablePos[i];
      whatMouseMove = 0;
      whatMouseClick = 0;
      paintCoins();
      break;
    }
  }
  resumeGame();
}

function paintCoins() {
  for (var i = 0; i < playerCoins.length; i++) {
    if (playerCoins[i] != 0) {
      drawCoin(i, playerCoins[i]);
    }
  }
}

function getHumanSlide() {
  slidingPhase = 0;
  lightFreeSlides();
  whatMouseMove = 3;
  whatMouseClick = 3;
}

function getHumanFly() {
  getHumanSlide();
}

//Draw a circle at the given position with the given color.
function drawCircle(pos, color) {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(coin2Pos(pos)[0], coin2Pos(pos)[1], circleRadius, 0, 2 * Math.PI, false);
  ctx.fill();
}

//Sliding phase:
//  0: Choose coin
//  1: Choose empty spot
var slidingPhase = 0;

//Light up the free sliding moves initially, for the active player/active coin.
function lightFreeSlides() {
  var slideable = getSlideable(activePlayer);
  writeLog('Light free slides: ' + slideable);
  for (var i = 0; i < slideable.length; i++) {
    drawCircle(slideable[i], pickableColor);
  }
}

//Handle mouse move if in slide phase.
function handleMouseMoveSlide(x, y) {
  switch (slidingPhase) {
    case 0:
      var slideableCoins = getSlideable(activePlayer);
      paintMouseCoins(x, y, slideableCoins, pickedColor, pickableColor);
      break;
    case 1:
      var neig = getFreeNeighbours(selectedCoin);
      paintMouseCoins(x, y, neig, pickedColor, pickableColor);
      paintMouseCoins(x, y, [selectedCoin], pickedColor, selectedColor);
      break;
  }
}

var selectedCoin;

//Handle mouse click if in slide phase.
function handleMouseClickSlide(x, y) {
  switch (slidingPhase) {
    case 0:
      var slideableCoins = getSlideable(activePlayer);
      for (var i = 0; i < slideableCoins.length; i++) {
        var dist = Math.sqrt(Math.pow(x-coin2Pos(slideableCoins[i])[0], 2)+Math.pow(y-coin2Pos(slideableCoins[i])[1], 2));
        if (dist <= circleRadius) {
          selectedCoin = slideableCoins[i];
          slidingPhase = 1;
          paintCoins();
          paintPosition(slideableCoins[i], selectedColor);
          var neig = getFreeNeighbours(selectedCoin);
          for (var j = 0; j < neig.length; j++) {
            paintPosition(neig[j], pickableColor);
          }
          break;
        }
      }
      break;
    case 1:
      var neig = getFreeNeighbours(selectedCoin);
      for (var i = 0; i < neig.length; i++) {
        var dist = Math.sqrt(Math.pow(x-coin2Pos(neig[i])[0], 2)+Math.pow(y-coin2Pos(neig[i])[1], 2));
        if (dist <= circleRadius) {
          activeCoin = [selectedCoin, neig[i]];   //[from, to]
          slidingPhase = 0;
          paintEmptyBlack();
          paintCoins();
          whatMouseMove = 0;
          whatMouseClick = 0;
          resumeGame();
          break;
        }
      }
      var dist = Math.sqrt(Math.pow(x-coin2Pos(selectedCoin)[0], 2)+Math.pow(y-coin2Pos(selectedCoin)[1], 2));
      if (dist <= circleRadius) {
        slidingPhase = 0;
        paintEmptyBlack();
        paintCoins();
        lightFreeSlides();
      }
      break;
  }
}

//paint the given position dot in the given color.
function paintPosition(pos, color) {
  var can = document.getElementById("mainCanvas");
  var ctx = can.getContext("2d");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(coin2Pos(pos)[0], coin2Pos(pos)[1], circleRadius, 0, 2 * Math.PI, false);
  ctx.fill();
}
