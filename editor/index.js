
$(document).ready(function(){

  $.get('api/maps')
    .done(function(data) {
      console.log(data);
    })
    .fail(function(err) {
      console.log(err);
    });

  var canvas = document.getElementById('canvas');
  var context = canvas.getContext("2d");
  $(window).resize(function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  $(window).resize();

  var crateImg = new Image();
  crateImg.src = "images/crate.jpg";

  var map = [];
  var used = {};
  var input = {};
  var cx = 0;
  var cy = 0;
  var STEP = 16;
  var BOX_SIZE = 64;
  var mx = 0;
  var my = 0;

  var drawGrid = true;

  $(document).keydown(function(evt) {
    var key = evt.keyCode || evt.which;
    input[key] = true;
  });

  $(document).keyup(function(evt) {
    var key = evt.keyCode || evt.which;
    input[key] = false;
  });

  setInterval(function() {
    update();
    render();
  }, 10);

  function update() {
    if (input[65]) {
      cx += STEP;
    } else if (input[68]) {
      cx -= STEP;
    }

    if (input[87]) {
      cy += STEP;
    } else if (input[83]) {
      cy -= STEP;
    }
  }

  $(document).click(function(evt) {
    if (used[mx + " " + my] === true) {
      for (var i = 0; i < map.length; i++) {
        var m = map[i];
        if (m.x === mx && m.y === my) {
          map.splice(i, 1);
          delete used[mx + " " + my];
          break;
        }
      }
    } else {
      used[mx + " " + my] = true;
      map.push({
        x: mx,
        y: my
      });
    }
  });

  $(document).mousemove(function(evt) {
    var x = evt.clientX - cx;
    var y = evt.clientY - cy;
    if (x < 0) x -= BOX_SIZE;
    if (y < 0) y -= BOX_SIZE;
    var i = parseInt(x / BOX_SIZE);
    var j = parseInt(y / BOX_SIZE);
    mx = i * BOX_SIZE;
    my = j * BOX_SIZE;
  });

  function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);


    for (var i in map) {
      var crate = map[i]
      context.save();
      context.translate(crate.x + cx, crate.y + cy);
      context.drawImage(crateImg, 0, 0);
      context.restore();
    }
  }

});
