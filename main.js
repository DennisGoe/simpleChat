$(function(){

    var socket = io.connect();
    var messageForm = $('#messageForm');
    var message = $('#message');
    var chatContent = $('#chatContent');
    var messageContainer = $('#messageContainer')
    var loginFormContainer = $('#loginFormContainer')
    var loginForm = $('#loginForm');
    var users = $('#users');
    var username = $('#username');
    var footer= $('#footer');
    var localUsername = socket.username;


    var testMode = false;

    //hide the chat so user has to enter a name first

    if(testMode){
        loginForm.hide();
    }else{
        messageContainer.hide();
        footer.hide();
    }


    //aalways auto scrool to bottom of chat
    chatContent.scrollTop = chatContent.scrollHeight;

    //is called when the user sends a message
    //first the 'send message' event on the server site is called and the message content is passed on to that
    //then the 'new message' event is emitted by the server and passed to the client
    messageForm.submit(function(e){
      e.preventDefault();
      console.log("message: " + message.val());
      socket.emit('send message', message.val());
      message.val('');
    });

    //server emitts the new message
    //the content of that message is wrapped in a div and appended to the chat together with the user name
    socket.on('new message', function(data){
      if(data.username === socket.username){
        var currentdate = new Date();
        var time = (currentdate.getHours() + ":" + (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes());
          chatContent.append('<div class ="ownChatMessage">' + '<p id="username">' + data.username + '</p>' + '<p id="timestamp">' + time + '</p>' + '</br>' + '<p id="messageContent">' + data.msgContent + '</p>');
      }
      else{
        var currentdate = new Date();
        var time = (currentdate.getHours() + ":" + (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes());
          chatContent.append('<div class ="otherChatMessage">' + '<p id="username">' + data.username + '</p>' + '<p id="timestamp">' + time + '</p>' + '</br>' + '<p id="messageContent">' + data.msgContent + '</p>');

      }

        //chatContent.scrollTop(chatContent.height());
      });
    //this is called when the user logs in
    //the 'new user' event is passed to the server
    loginForm.submit(function(e){
      e.preventDefault();
      socket.emit('new user', username.val(), function(data){
        if(data){
            loginFormContainer.hide();
            messageContainer.show();
            footer.show();
        }
      });
      username.val('');
    });


    //this is called to show all the users
    //the server returns a list with all the users so we can loop through it and display the names
    socket.on('get users', function(data){
      var html ='';
      for ( i = 0; i < data.length; i++){
        html += '<li class="userNameDiv">' + data[i] +'</li>';
      }
      users.html(html);
      oldList = data.length;
    });

    //recognize disconnection of user
    socket.on('new connection', function(data){
      chatContent.append('<div class="userUpdate">' + data + " has joined the chat" +'</div>');
    });
    //recognize disconnection of user
    socket.on('disconnect', function(data){
     chatContent.append('<div class="userUpdate">' + data + " has left the chat" +'</div>');
    });
    });
