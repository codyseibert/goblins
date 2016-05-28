$(document).ready(function(){
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext("2d");
  $(window).resize(function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  $(window).resize();

  var players = {};

  var playerId = null;

  var playerImg = new Image();
  playerImg.src = "images/player.gif";

  var crateImg = new Image();
  crateImg.src = "images/crate.jpg";

  var orcImg = new Image();
  orcImg.src = "images/orc.png";

  var skullImg = new Image();
  skullImg.src = "images/skull.png";

  var A = 97;
  var D = 100;
  var SPACE = 32;
  var E = 69;

  var keyMap = {
    65: 'left',
    68: 'right',
    32: 'jump',
    69: 'explode'
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
    playerId = i;
  });

  socket.on('player', function(p) {
    if (!players[p.id]) {
      players[p.id] = p;
    }
    var player = players[p.id];
    player.lastUpdated = new Date();
    _.extend(player, p);
    render()
  });

  socket.on('player.disconnected', function(p) {
    delete players[p.id]
  });

  setInterval(function() {
    for (var i in Object.keys(players)) {
      var key = Object.keys(players)[i]
      var player = players[key];
      if (player && player.lastUpdated < (new Date().getTime() - 10000)) {
        delete players[key]
      }
    }
  }, 1000);

  function render() {
    var cx, cy;
    cx = cy = 0;
    if (playerId && players[playerId]) {
      cx = parseInt(window.innerWidth / 2 - players[playerId].x, 10);
      cy = parseInt(window.innerHeight / 2 - players[playerId].y, 10);
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var id in players) {
      var player = players[id]
      var scaleX = player.isFacingLeft ? -1 : 1
      var scale = 3.1
      context.save();
      context.translate(player.x + cx, player.y + cy);
      context.scale(scaleX / scale, 1 / scale);
      var img = player.team === 0 ? playerImg : orcImg
      img = player.isAlive ? img : skullImg;
      context.drawImage(img, -150, -64);
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
