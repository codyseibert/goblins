var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

var port = process.env.PORT || 8080;

var router = express.Router();

router.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  if (username === 'testing' && password === '123456') {
    res.status(200);
    res.send({
      message: 'success!'
    });
  } else {
    res.status(401);
    res.send({
      message: 'failure!'
    });
  }

});

app.use('/api', router);

app.listen(port);
