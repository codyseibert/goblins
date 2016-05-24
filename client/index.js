$(document).ready(function(){
  $('#login').click(function(){
    var username = $('#username').val();
    var password = $('#password').val();

    $.post('http://localhost:8080/api/login', {
      username: username,
      password: password
    })
      .done(function(msg) {
        console.log(msg);
      })
      .fail(function(xhr, textStatus, errorThrown) {
        console.log('here');
        console.log(errorThrown);
      });
  });
});
