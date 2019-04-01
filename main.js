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
    var selectChatMembers = $('.selectChatMembers');
    var allChatsWrapper = $('.allChatsWrapper');
    var onlineUsersWrapper = $('#onlineUsersWrapper');
    var newChat = $('#newChat');
    var chosenUsers = $('.chosenUsers');
    var continueButton = $('#continueButton');
    var chatName = $('#chatName');
    var tempChatID = "globalChat";
    var allChatsContainer = $('.allChatsContainer');
    var chatMessages = $('.chatMessages');

    var chatID = "";
    
    var newChatData = [];

    //here are the states for continue button. just as booleans
    //these are used for creating a new chat since we want to use the same button mutliple times
    var selectMode = false;
  
    //hide the chat so user has to enter a name first
    var testMode = false;
    if(testMode){
        loginForm.hide();
    }else{
        messageContainer.hide();
        footer.hide();
        allChatsWrapper.hide();
        onlineUsersWrapper.hide();
    }

    //here you find all the elements of the DOM that are initially hidden
  
    selectChatMembers.hide();
    continueButton.hide();
    chatName.hide();

    //the window for selecting chat members is initially hidden
    newChat.submit(function(e){
      e.preventDefault();
      selectChatMembers.show();
      selectMode = true;
      $('#instructionsForCreatingNewChat').text("Select one or multiple chat members from the list of online users on the left!");
      chatName.hide();
      continueButton.hide();
      //this array kepps all the data needed for a new group chat
      //in the first index will be the group name and after that come the IDs of the sockets
      //that happens in the section under "get users"
      newChatData = [];
    });

   


    //always auto scrool to bottom of chat
    chatContent.scrollTop = chatContent.scrollHeight;

    //is called when the user sends a message
    //first the 'send message' event on the server site is called and the message content is passed on to that
    //then the 'new message' event is emitted by the server and passed to the client
    messageForm.submit(function(e){
      e.preventDefault();
      console.log("message: " + message.val());
      socket.emit('send message', message.val(), tempChatID);
      message.val('');
    });

    //server emitts the new message
    //the content of that message is wrapped in a div and appended to the chat together with the user name
    socket.on('new message', function(data){
      console.log('I received a new message for chat: ' + data.chatID);
      console.log("The message has the content: " + data.msgContent);
      if(data.username === username){
        var currentdate = new Date();
        var time = (currentdate.getHours() + ":" + (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes());
        chatMessages.append('<div class ="ownChatMessage" messageID ="' + data.chatID + '">' + '<p id="username">' + data.username + '</p>' + '</br>' + '<p id="messageContent">' + data.msgContent + '</p>' + '<p id="timestamp">' + time + '</p>');
        $('div[messageID="' + data.chatID + '"]').hide();
        console.log("appending message to chat messages");
        console.log(chatMessages.children());
     }
      else{
        console.log("inside else of new message");
        var currentdate = new Date();
        var time = (currentdate.getHours() + ":" + (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes());
        chatMessages.append('<div class ="otherChatMessage" messageID ="' + data.chatID + '">' + '<p id="username">' + data.username + '</p>' + '</br>' + '<p id="messageContent">' + data.msgContent + '</p>' + '<p id="timestamp">' + time + '</p>');
        $('div[messageID="' + data.chatID + '"]').hide();
        console.log("appending message to chat messages");
        console.log(chatMessages.children());
      }
      displayMessages();
      
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
            allChatsWrapper.show();
            onlineUsersWrapper.show();
        }
      });
      username.val('');
    });


    //this is called to show all the users
    //the server returns a list with all the users so we can loop through it and display the names
    socket.on('get users', function(data){
      users.children().unbind();
     
      users.html('');
      for ( i = 0; i < data.length; i++){
        users.append('<div class="userNameDiv" username="' +data[i][0] + '" id="' + data[i][1] +  '">' + data[i][0] +'</div>');
      }
   
        users.children().click(function(){
          if(selectMode){
            chosenUsers.append('<div class = "' + this.id + '">' + $(this).attr("username") + '</div>');
            continueButton.show();
            continueButton.off();
            newChatData.push(this.id);
            
            continueButton.click(function(){
                $('#instructionsForCreatingNewChat').text("Type in a name for the chat");
                chatName.show();
                if(chatName.val()){
                 chatID = generateChatID();
                 console.log("chatID: " + chatID);
                 newChatData.unshift(chatName.val());
                 newChatData.unshift(chatID);
                 chosenUsers.children().empty();
                 selectChatMembers.hide();
                 chatName.val('');
                 console.log("new chat data array " + newChatData);
                 socket.emit('new chat', newChatData);
                }
            });
          }   
         
            
        });   
     
      
    });

    socket.on('create chat', function(chatName){
      console.log("create chat has been called");
      allChatsContainer.append('<div class="singleChatRoom" id="' + chatID + '" chatID="' + chatID + '">' + chatName + '</div>');
      console.log("current temp chatID " + tempChatID);
      allChatsContainer.children().unbind();
      
      allChatsContainer.children().click(function(){
      tempChatID = this.id;
      console.log("this is the ID of the last clicked chat: " + tempChatID);
      displayMessages();

      
    
    });
    
    });
    //recognize disconnection of user
    socket.on('new connection', function(data){
      chatMessages.append('<div class="userUpdate">' + data + " has joined the chat" +'</div>');
    });
    //recognize disconnection of user
    socket.on('disconnect', function(data){
     chatMessages.append('<div class="userUpdate">' + data + " has left the chat" +'</div>');
    });

    //We generate a unique ID for every single group chat so the server can determine to which group a message is sent
    function generateChatID(){
      return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 7);
    }

    //this function displays the message depending on the currently selected chat group
    function displayMessages(){
      for(var index = 0; index < chatMessages.children().length; index++){
        console.log("im looping through all the messages");
        console.log(chatMessages.children().eq(index));
        if(chatMessages.children().eq(index).attr("messageID") == tempChatID || chatMessages.children().eq(index).attr("class") == "userUpdate"){
          chatMessages.children().eq(index).show();
        } else {
          chatMessages.children().eq(index).hide();
        } 

        
      }
    }

    });//end of big function ALWAYS NEEDS TO BE HERE!
