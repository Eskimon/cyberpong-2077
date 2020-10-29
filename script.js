var PLAY_WIDTH = 800;
var PLAY_HEIGHT = 400;
var LINE_WIDTH = 10;
var PADDLE_LENGTH = 100;
var OFFSET_Y = document.getElementById('board').offsetTop + 1;

var backplayer = document.getElementById('backplayer');
var boingplayer = document.getElementById('boingplayer');


function makeRect(x, y, width, height, bgcolor, classes) {
  var elem = document.createElement("div");

  var s = elem.style;
  s.position = "absolute";
  s.padding = "0";
  if (bgcolor)
    s.backgroundColor = bgcolor;
  s.top = y + "px";
  s.left = x + "px";
  s.width = width + "px";
  s.height = height + "px";
  elem.classList.add(classes);
  return elem;
}

/* a little something for IE <= 8's benefit */
if (!document.addEventListener) {
  document.addEventListener = function (eventName, func) {
    eventName = "on" + eventName;
    if (this[eventName]) {
      var temp = this[eventName];
      this[eventName] = function () {
        console.log(event);
        temp(event);
        func(event);
      };
    } else {
      this[eventName] = function () {
        func(event)
      };
    }
  };
}

/* This class represents the player's paddle and score. */
function Player(scoreDisplay, x, y, width, height, extra_classes) {
  this.x = x;
  this.y = y;
  this.startY = y;
  this.width = width;
  this.height = height;
  this.score = 0;
  this.scoreDisplay = scoreDisplay;
  this.classes = extra_classes;
  this.elem = makeRect(this.x, this.y, this.width, this.height, null, this.classes);
  document.getElementById("board").appendChild(this.elem);
}

/* The reset() method is used after a Game Over to put everything back to its
starting position */
Player.prototype.reset = function () {
  this.moveTo(this.startY);
  this.score = 0;
  this.scoreDisplay.innerHTML = this.score;
};

/* The moveTo() method is used to move the paddle, check to make it stay inside
the bounds of play, and update the display of the paddle on the screen */
Player.prototype.moveTo = function (y) {
  this.y = y;
  if (this.y > PLAY_HEIGHT - PADDLE_LENGTH) {
    this.y = PLAY_HEIGHT - PADDLE_LENGTH;
  } else if (this.y < 0) {
    this.y = 0;
  }
  this.elem.style.top = Math.floor(this.y) + "px";
};

/* The scored() method is used to increase a player's score and update the
display of the score. */
Player.prototype.scored = function () {
  this.score++;
  this.scoreDisplay.innerHTML = this.score;
};

/* The AI() method is the Artificial Intelligience for paddles. This implementation
is pretty stupid and easy to beat, but offers a fairly reasonable behavior that is
nice to play against for such a simple game. */
Player.prototype.AI = function (ball) {
  /* the AI player is only going to play when the ball is moving towards it.
  This means that the AI is specifically only coded for the paddle on the right
  side of the play area */
  if (ball.dx > 0) {
    if (ball.y > this.y + this.height - LINE_WIDTH) {
      // the ball has moved past the bottom of the paddle
      this.moveTo(this.y + 1);
    } else if (ball.y < this.y) {
      // the ball has moved past the top of the paddle
      this.moveTo(this.y - 1);
    }
  }
};


/* The intersect() method checks to see if the rectangle for the ball
overlaps the rectangle for the paddle in any way. It returns a TRUE/FALSE
value that can be used to direct the calling function. */
Player.prototype.intersect = function (ball) {
  return ball.x + ball.width >= this.x &&
    ball.x <= this.x + this.width &&
    ball.y + ball.height >= this.y &&
    ball.y < this.y + this.height;
};

/* The bounce() methods checks to see if the ball hit the paddle (using
the intersect() method), then reflects the ball away, adding some english
to the ball for strategic players to exploit. */
Player.prototype.bounce = function (ball) {
  if (this.intersect(ball)) {
    /* Increase the speed of the ball slightly */
    ball.dx *= -1.1;

    /* determine how far the middle of the ball is from the middle
    of the paddle. */
    var dy = (this.y + this.height / 2) - (ball.y + ball.height / 2);

    /* add some english to the ball as it bounces away, proportional
    to how far from the center of the paddle the ball is. The value
    of 333 has no inherent meaning. I picked it because it seemed to
    work well. This is what is usually called a "fudge factor". */
    ball.dy -= dy / 333;

    /* tell the calling function a collision occured */
    return true;
  }

  /* or, tell the calling function that no collision occured */
  return false;
}

/* This class represents the ball's position. */
function Ball(width, height) {
  //this keeps the ball off the screen so it doesn't appear in a weird place.
  this.x = -1000;
  this.y = 0;
  this.dx = 0;
  this.dy = 0;
  this.width = width;
  this.height = height;
  this.elem = makeRect(this.x, this.y, this.width, this.height, undefined, 'ball');
  document.getElementById("board").appendChild(this.elem);
}

/* The drop() function puts the ball "in play". It takes a direction and a
max-speed for the ball, then figures out a semi-random direction in which to
launch the ball. Initially, the ball is setup way off-screen so it doesn't appear
before the game has started. */
Ball.prototype.drop = function (direction, speed) {
  //get the ball out of view before the start of play
  this.x = -1000;
  this.y = 0;
  this.display();

  //Putting the ball in the center of the play area
  this.x = (PLAY_WIDTH - LINE_WIDTH) / 2;
  this.y = (PLAY_HEIGHT - LINE_WIDTH) / 2;

  /* Another "fudge factor" for speed. Ensures a minimum speed (0.2 pixels
  per millisecond) as well as a maximum speed (0.2 + 0.3 = 0.5 pixels per
  millisecond). The speed is based on the current combined score of the
  two players, and as the game is to 5, the highest score before a game-over
  is 4 to 4, so the highest speed is 8. */
  var vel = 0.2 + 0.3 * speed / 8;

  /* Using a random number generator, picks an angle at which to launch the
  ball. It's will be any angle in a 90 degree wedge pointed in the direction
  of one of the paddles. */
  var angle = (Math.random() * 2 - 1) * Math.PI / 4;

  /* sets the initial velocity of the ball */
  this.dx = direction * Math.cos(angle) * vel;
  this.dy = Math.sin(angle) * vel;
};

/* The display() method puts the ball's representing DIV tag where it should
be on the display area. This is done separately because we may need to update
the location of the ball many times before showing its location on screen. */
Ball.prototype.display = function () {
  this.elem.style.top = Math.floor(this.y) + "px";
  this.elem.style.left = Math.floor(this.x) + "px";
};

/* The advance() method moves the ball forward by its velocity */
Ball.prototype.advance = function () {
  this.x += this.dx;
  this.y += this.dy;
};

/* The bounced() method checks to see if the ball has bounced off of anything,
either the top/bottom walls of the play field or one of the players' paddles. */
Ball.prototype.bounced = function (p1, p2, maxY) {
  // check to see if the ball hit the top wall
  if (this.y < 0 || this.y >= maxY) {
    this.dy *= -1;
  }

  // check to see if the ball hit either of the paddles.
  return p1.bounce(this) || p2.bounce(this);
};

/* These variables are used to keep track of things that we
need to play the game. */
var p1, p2, ball, timer, lastFrame, startButton, statusBox, state;

/* This is an "event". It occurs when something happens. In this case, when the
user moves their mouse. We use it to move the user's paddle. */

function movePlayer1(y) {
  p1.moveTo(y - PADDLE_LENGTH / 2);
}

window.onload = function () {
  // need to be able to show/hide the start button
  startButton = document.getElementById("start");
  // need to be able to show/hide the status display
  statusBox = document.getElementById("status");

  // This should be pretty self-explanatory
  ball = new Ball(LINE_WIDTH, LINE_WIDTH);

  // making the paddles for each of the players
  p1 = new Player(
    document.getElementById("score1"), // this player's score box
    LINE_WIDTH, // the location of the paddle is spaced enough to give a full ball-width behind it
    (PLAY_HEIGHT - PADDLE_LENGTH) / 2, // vertically center the paddle on the play area
    LINE_WIDTH, // the paddle's width is the same size as all of the other lines
    PADDLE_LENGTH,  // standardized height
    'paddle-left');

  // exactly the same as the other paddle, except on the opposite side of the screen.
  p2 = new Player(
    document.getElementById("score2"),
    PLAY_WIDTH - LINE_WIDTH * 2, // the left edge of the paddle is a ball's width and a paddle's width away from the right edge of the board
    (PLAY_HEIGHT - PADDLE_LENGTH) / 2,
    LINE_WIDTH,
    PADDLE_LENGTH,
    'paddle-right');

  
  if (navigator.userAgent.indexOf("iPad") != -1 ||
    navigator.userAgent.indexOf("iPod") != -1 ||
    navigator.userAgent.indexOf("iPhone") != -1 ||
    navigator.userAgent.indexOf("Android") != -1) {
    console.log("Is Mobile OS");
    document.addEventListener("touchmove", function (evt) {
      if (evt.touches.length > 0) {
        movePlayer1(evt.touches[0].pageY);
      }
      evt.preventDefault();
    });
  } else {
    console.log("Is Desktop OS");
    document.addEventListener("mousemove", function (evt) {
      movePlayer1(evt.clientY - OFFSET_Y);
    });
  }

};


/* the following functions are all game-state management functions.
The game goes through multiple states: title screen, play, between-points,
and game-over. These functions handle one of each. */

/* we're doing literally nothing for the title screen. A separate button
on the page controls this */
function titleScreen(delta) {
  //not going to do anything right now
}

/* The time before the ball goes live is used to prepare the user.
The delta parameter to the function tells the function how long it
has been since the last major update. */
function prePlay(delta) {
  if (delta < 1000) // Displayed during the first second
    statusBox.innerHTML = "Ready...";
  else if (delta < 2000) // Displayed during the second second
    statusBox.innerHTML = "Set...";
  else if (delta < 3000) // Displayed during the third second
    statusBox.innerHTML = "GO!";
  else {
    statusBox.style.display = "none"; // hide the status box we were just using
    state = updateGame; // change the state of the game to live-action
    return true; // tell the calling function that this function says its okay to update the timer
  }
  return false;
}

/* This is "The Game". This is were all of the logic for the game is managed. */
function updateGame(delta) {
  /* to update the location of the game, we're going to simulate it's position at
  every millisecond since the last update. */
  for (var i = 0; i < delta && state == updateGame; ++i) {
    // move the ball
    ball.advance();

    // check to see what happened to the ball
    if (!ball.bounced(p1, p2, PLAY_HEIGHT - LINE_WIDTH)) {
      var scoringPlayer = null;
      /* if the ball didn't hit anything, did it go past
      any of the paddles? */
      if (ball.x < p1.x) {
        // slipping past paddle 1 means player 2 scored
        scoringPlayer = p2;
      } else if (ball.x > p2.x) {
        // slipping past paddle 1 means player 2 scored
        scoringPlayer = p1;
      }

      // if one of the players scored
      if (scoringPlayer != null) {
        // increase their score
        scoringPlayer.scored();
        //redrop the ball
        ball.drop(scoringPlayer == p1 ? 1 : -1, p1.score + p2.score);
        //show the status box for the next game state
        statusBox.style.display = "block";
        if (scoringPlayer.score < 5) {
          /* we're still playing if the person who just scored hasn't hit
          the max score. */
          state = prePlay;
        } else {
          state = gameOver;
        }
      }
    } else {
      try {
        boingplayer.play();
      } catch (error) {}
    }
  }

  if (state == updateGame) {
    /* If we're still playing and haven't gone to the game-over or inter-point state,
    then we'll run the P2 AI based on the ball's new location */
    for (var i = 0; i < delta; i += AI_STEP) {
      p2.AI(ball);
    }
    ball.display();
  }

  return true;
}

var AI_STEP = 5;

/* This is really simple, mostly just spends a few of seconds displaying the Game Over
text before resetting the game to the title screen */
function gameOver(delta) {
  if (delta < 3000) {
    statusBox.innerHTML = "Game Over";
  } else {
    clearInterval(timer);
    statusBox.style.display = "none";
    startButton.style.display = "block";
    p1.reset();
    p2.reset();
    state = titleScreen;
    return true;
  }
  return false;
}


/* this function is the "time keeper" of the game. We have to know how much time
it took to update the screen each time we've shown something, so we know how far
to move the ball next time. */
function timerTick() {
  var currentFrame = new Date().getTime();
  var delta = currentFrame - lastFrame;
  if (state(delta)) {
    lastFrame = currentFrame;
  }
}

/* this function is called when the start button is clicked. It initializes the game
and starts the timer working. */
function start() {
  startButton.style.display = "none";
  statusBox.style.display = "block";
  lastFrame = new Date().getTime();
  ball.drop(1, 0);
  state = prePlay;
  timer = setInterval(timerTick, 33); //roughly 30 FPS  (1000 / 30) = 33
}

function splash() {
  var splash = document.getElementById('splash');
  splash.classList.add("hide");
  try {
    backplayer.play();
  } catch (error) {
  }
}

/* Konami code handling */

// a key map of allowed keys
var allowedKeys = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  65: 'a',
  66: 'b'
};

// the 'official' Konami Code sequence
var konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];

// a variable to remember the 'position' the user has reached so far.
var konamiCodePosition = 0;

// add keydown event listener
document.addEventListener('keydown', function (e) {
  // get the value of the key code from the key map
  var key = allowedKeys[e.keyCode];
  // get the value of the required key from the konami code
  var requiredKey = konamiCode[konamiCodePosition];

  // compare the key with the required key
  if (key == requiredKey) {

    // move to the next key in the konami code sequence
    konamiCodePosition++;

    // if the last key is reached, activate cheats
    if (konamiCodePosition == konamiCode.length) {
      activateCheats();
      konamiCodePosition = 0;
    }
  } else {
    konamiCodePosition = 0;
  }
});

function activateCheats() {
  let elmt = document.getElementById('konami');
  elmt.classList.add("show");
  setTimeout(() => {
    elmt.classList.remove("show");
  }, 4000);
}
