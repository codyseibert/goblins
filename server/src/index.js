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
  new Box(196, 300, 64, 64),
  new Box(300, 300, 64, 64),
  new Box(364, 300, 64, 64)
]

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

var clients = {}
var users = {}

var JUMP_OFFSET = 5;
var JUMP_HEIGHT = 50;
var JUMP_SPEED = -5.0;
var GRAVITY = 0.2;
var SPEED = 5;
var FRICTION = 0.80;

var User = function (){
  this.x = 0;
  this.y = 0;
  this.vx = 0;
  this.vy = 0;
  this.id = null;
  this.width = 50;
  this.height = 50;
  this.isFacingLeft = false;
  this.input = {
    left: false,
    right: false,
    jump: false
  };
  this.canJump = false;
};

var disconnectQueue = []

io.on('connection', function(client) {

  client.emit('map', map);
  client.emit('id', client.id);

  client.on('join', function() {
    users[client.id] = new User()
    users[client.id].id = client.id;
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

setInterval(function(){
  // Handle Inputs & Update Positions
  var userIds = Object.keys(users);
  userIds.forEach(function(id) {
    var user = users[id];
    if (user.input.left) {
      user.vx = -SPEED;
      user.isFacingLeft = true;
    } else if (user.input.right) {
      user.vx = SPEED;
      user.isFacingLeft = false;
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
      user.x -= user.xy;
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

app.use('/api', router);

server.listen(port);
