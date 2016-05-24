$(document).ready(function(){

  var players = {};

  var A = 97;
  var D = 100;
  var SPACE = 32;

  var keyMap = {
    65: 'left',
    68: 'right',
    32: 'jump'
  };

  var input = {}

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

  socket.on('player', function(p) {
    // console.log(player);
    if (!players[p.id]) {
      players[p.id] = p;
      var $player = $('<div></div>')
        .addClass('player');
      players[p.id].$ = $player
      $('body').append($player);
    }

    var player = players[p.id];
    player.x = p.x;
    player.y = p.y;
    player.$.offset({
      left: player.x,
      top: player.y
    });

  });

  socket.on('player.disconnected', function(p) {
    players[p.id].$.remove();
    delete players[p.id]
  });

});
