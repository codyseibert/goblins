// TODO:
// - show an explosion when user explodes
// - center the explosion "near" call on the player
// - create a more advanced map
// - kill a player when they go out of bounds
// - have a map timer


require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var js2dmath = require('js-2dmath');
var Vec2 = js2dmath.Vec2;
var Polygon = js2dmath.Polygon;
var Intersection = js2dmath.Intersection;

var Box = function(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};


var map = [
  new Box(0, 300, 64, 64),
  new Box(64, 300, 64, 64),
  new Box(128, 300, 64, 64),
  new Box(300, 300, 64, 64),
  new Box(364, 300, 64, 64)
]

for (var i = 0; i < 100; i++) {
  map.push(new Box(i*64 - 500, 500, 64, 64))
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

var clients = {}
var users = {}

var roundOver = false;

var JUMP_OFFSET = 5;
var JUMP_HEIGHT = 50;
var JUMP_SPEED = -15.0;
var GRAVITY = 0.5;
var SPEED = 8;
var FRICTION = 0.80;
var EXPLODE_SPEED = 30;
var RESPAWN_TIME = 3000;
var EXPLODE_RADIUS = 500;
var ROUND_OVER_TIME = 5000;

var User = function (){
  this.x = 0;
  this.y = 0;
  this.vx = 0;
  this.vy = 0;
  this.isAlive = true;
  this.id = null;
  this.width = 50;
  this.height = 50;
  this.team = parseInt(Math.random()*2)
  this.isFacingLeft = false;
  this.input = {
    left: false,
    right: false,
    jump: false,
    explode: false
  };
  this.canJump = false;
};

var disconnectQueue = []

io.on('connection', function(client) {

  client.emit('map', map);

  client.emit('id', client.id);

  client.on('join', function() {
    user = new User()
    user.id = client.id;
    user.team = 1;
    users[client.id] = user;
  });

  client.on('input', function(input) {
    users[client.id].input = input
  });

  client.on('disconnect', function() {
    disconnectQueue.push(users[client.id]);
  });

});

var isColliding = function(player, objects) {
  for (var i = 0; i < objects.length; i++) {
    obj = objects[i];
    var boxPoly = Polygon.create(
      Vec2.create(obj.x, obj.y),
      Vec2.create(obj.x + obj.width, obj.y),
      Vec2.create(obj.x + obj.width, obj.y + obj.height),
      Vec2.create(obj.x, obj.y + obj.height)
    )
    var playerPoly = Polygon.create(
      Vec2.create(player.x, player.y),
      Vec2.create(player.x + player.width, player.y),
      Vec2.create(player.x + player.width, player.y + player.height),
      Vec2.create(player.x, player.y + player.height)
    )
    var intersection = Intersection.polygon_polygon(boxPoly, playerPoly);
    if (intersection.reason === 8) {
      return true;
    }
  }
  return false;
}

function spawn(user) {
  user.x = 100;
  user.y = 100;
  user.isAlive = true;
}

function isRoundOver() {
  var goblins = 0;
  var orcs = 0;
  Object.keys(users).forEach(function(id) {
    var user = users[id];
    if (user.team === 1) {
      goblins++;
    } else {
      orcs++;
    }
  })
  return orcs === 0;
}

function restartRound() {
  roundOver = true
  io.emit('round.end');
  setTimeout(function(){
    io.emit('round.start');
    Object.keys(users).forEach(function(id) {
      var user = users[id];
      spawn(user);
      user.team = 0;
    })
    var userIds = Object.keys(users);
    var random = userIds[parseInt(Math.random()*userIds.length)];
    users[random].team = 1;
    roundOver = false;
  }, ROUND_OVER_TIME);
}

function checkForEndRound() {
  if (Object.keys(users).length >= 2 && !roundOver && isRoundOver()) {
    restartRound();
  }
}

function kill(user){
  user.isAlive = false;
  user.team = 1;

  setTimeout(function(){
    if (!roundOver) {
      spawn(user);
    }
  }, RESPAWN_TIME);
}

setInterval(function(){
  checkForEndRound();

  // Handle Inputs & Update Positions
  var userIds = Object.keys(users);
  userIds.forEach(function(id) {
    var user = users[id];

    if (user.isAlive) {
      if (user.input.left) {
        user.vx = -SPEED;
        user.isFacingLeft = true;
      } else if (user.input.right) {
        user.vx = SPEED;
        user.isFacingLeft = false;
      }
    }

    if (user.team === 1 && user.input.explode && user.isAlive) {
      user.isAlive = false;
      user.vx = parseInt(Math.random() * EXPLODE_SPEED) - EXPLODE_SPEED / 2
      user.vy = Math.max(-5, parseInt(Math.random() * -EXPLODE_SPEED))
      io.emit('explode', user);

      userIds.forEach(function(userId) {
        var u = users[userId];
        if (u == user) return;
        var v1 = Vec2.create(user.x, user.y);
        var v2 = Vec2.create(u.x, u.y);
        if (Vec2.near(v1, v2, EXPLODE_RADIUS)) {
          kill(u);
        }
      });

      kill(user);
    }

    if (user.input.jump && user.canJump) {
      user.y -= JUMP_OFFSET;
      user.vy = JUMP_SPEED;
      user.canJump = false;
    }

    user.vy += GRAVITY;
    user.vx *= FRICTION;

    user.x += user.vx;
    if (isColliding(user, map)) {
      user.x -= user.vx;
    }

    user.y += user.vy;
    if (isColliding(user, map)) {
      if (user.vy > 0) {
        user.canJump = true;
      }

      user.y -= user.vy;
      user.vy = 0;
    }

    io.emit('player', user);
  });

  for (var i = disconnectQueue.length - 1; i >= 0; i--){
    player = disconnectQueue[i];
    io.emit('player.disconnected', player);
    delete users[player.id]
    delete clients[player.id]
    disconnectQueue.splice(i, 1);
  }

}, 10);

var port = process.env.PORT || 8080;
var router = express.Router();

// app.use('/api', router);
app.get('maps', function(req, res) {
  res.status(200);
  res.send([
    {
      name: 'testing',
      screenshot: 'null.png'
    }
  ]);
});

server.listen(port);
