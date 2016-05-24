var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

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
  this.input = {
    left: false,
    right: false,
    jump: false
  };
};

var disconnectQueue = []

io.on('connection', function(client) {
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

setInterval(function(){
  // Handle Inputs & Update Positions
  var userIds = Object.keys(users);
  userIds.forEach(function(id) {
    var user = users[id];
    if (user.input.left) {
      user.vx = -SPEED
    } else if (user.input.right) {
      user.vx = SPEED
    }

    if (user.input.jump) {
      user.y -= JUMP_OFFSET
      user.vy = JUMP_SPEED
    }

    user.vy += GRAVITY;
    user.vx *= FRICTION;

    user.x += user.vx;
    user.y += user.vy;

    user.y = Math.min(300, user.y);

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
