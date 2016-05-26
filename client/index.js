$(document).ready(function(){
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext("2d");
  $(window).resize(function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  $(window).resize();

  var players = {};

  var id = null;

  var playerImg = new Image();
  playerImg.src = "images/player.gif";

  var crateImg = new Image();
  crateImg.src = "images/crate.jpg";

  var A = 97;
  var D = 100;
  var SPACE = 32;

  var keyMap = {
    65: 'left',
    68: 'right',
    32: 'jump'
  };

  var input = {}
  var map = []

  $(document).keydown(function(evt) {
    var key = evt.keyCode || evt.which;
    input[keyMap[key]] = true;
    socket.emit('input', input);
  });

  $(document).keyup(function(evt) {
    var key = evt.keyCode || evt.which;
    input[keyMap[key]] = false;
    socket.emit('input', input);
  });

  var socket = io.connect('http://localhost:8080');
  socket.on('connect', function(data) {
    socket.emit('join', 'Hello World from client');
  });

  socket.on('map', function(m) {
    map = m;
  });

  socket.on('id', function(i) {
    id = i;
  });

  socket.on('player', function(p) {
    if (!players[p.id]) {
      players[p.id] = p;
    }
    var player = players[p.id];
    _.extend(player, p);
    render()
  });

  socket.on('player.disconnected', function(p) {
    delete players[p.id]
  });

  function render() {
    var cx, cy;
    cx = cy = 0;
    if (id) {
      cx = parseInt(window.innerWidth / 2 - players[id].x, 10);
      cy = parseInt(window.innerHeight / 2 - players[id].y, 10);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var id in players) {
      var player = players[id]
      var scaleX = player.isFacingLeft ? -1 : 1
      var scale = 3.1
      context.save();
      context.translate(player.x + cx, player.y + cy);
      context.scale(scaleX / scale, 1 / scale);
      context.drawImage(playerImg, -150, -64);
      context.restore();
    }

    for (var i in map) {
      var crate = map[i]
      context.save();
      context.translate(crate.x + cx, crate.y + cy);
      context.drawImage(crateImg, 0, 0);
      context.restore();
    }
  }

});
