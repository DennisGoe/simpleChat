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
    var password = $('#password');
    var newUsername = $('#newUsername');
    var newPassword = $('#newPassword');

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
    var chatTitle = $('.chatTitle');
    var newAccountButton = $('#newAccountButton');

    var uploadedFile = document.getElementById("uploadedFile");
    var base64String ="";


    var chatID = "";
    var localUser;
    var localId  = null;

    var newChatData = [];

    //here are the states for continue button. just as booleans
    //these are used for creating a new chat since we want to use the same button mutliple times
    var selectMode = false;

    //hide the chat until the user did login.
    messageContainer.hide();
    footer.hide();
    allChatsWrapper.hide();
    onlineUsersWrapper.hide();


    //here you find all the elements of the DOM that are initially hidden
    //They will be activated when certain actions come into effect
    selectChatMembers.hide();
    continueButton.hide();
    chatName.hide();

    //the window for selecting chat members, when creating a new private chat/ group is initially hidden
    //preventDefault tells the client that if the event does not get explicitly handled, its default action should not be taken as it normally would be
    //selectChatMembers.show will show the user that creates the chat, the members he can select
    //selectMode allows the creator to choose multiple members to add to the chat
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
      //also the user that creates the chat will be pushed as first user into the list
      newChatData = [];
      newChatData.push(localId);
    });

    //is called when the user sends a message
    //first the 'send message' event on the server site is called and the message content is passed on to that
    //the 'send message' event contains the message content, as well as the chatID of the chat the message should be send to
    //the 'sendLocalId' event contains the ID of the local user, as we need this information later on
    //then the 'new message' event is emitted by the server and passed to the client
    messageForm.submit(function(e){
      e.preventDefault();
      socket.emit('send message', message.val(), tempChatID);
      message.val('');
    });

    socket.on('sendLocalId', function(data) {
      localId = data;
    });

    //server emitts the new message
    //the content of that message is wrapped in a div and appended to the chat together with the user name
    socket.on('new message', function(data){

      //Here we check if the send message is from the local User or an outside user that is to the chat connected
      //This helps us to display the messagesite correct
      if(data.username === localUser){
        //We also add a timestamp to the send message, and add an '0' if the minute mark ist under 10 minutes.
        var currentdate = new Date();
        var time = (currentdate.getHours() + ":" + (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes());
        //Here we wrap the message with all its content inside a div, which will be later displayed at the chat
        chatMessages.append('<div class ="ownChatMessage" messageID ="' + data.chatID + '">' + '<p id="username">' + data.username + '</p>' + '</br>' + '<p id="messageContent">' + data.msgContent+ '</p>' + '<p id="messageContent">' + data.translation+ '</p>' + '<p id="mood"> Mood: ' + data.mood + '</p>' + '</p>' + '<p id="timestamp">' + time + '</p>');
        $('div[messageID="' + data.chatID + '"]').hide();
     }
      else{
        var currentdate = new Date();
        var time = (currentdate.getHours() + ":" + (currentdate.getMinutes()<10?'0':'') + currentdate.getMinutes());
        chatMessages.append('<div class ="otherChatMessage" messageID ="' + data.chatID + '">' + '<p id="username">' + data.username + '</p>' + '</br>' + '<p id="messageContent">' + data.msgContent + '</p>' + '<p id="mood"> Mood: ' + data.mood + '<p id="timestamp">' + time + '</p>');
        //This hides the message id, as i shouldnt be seen inside the message
        $('div[messageID="' + data.chatID + '"]').hide();
      }
        //This calls the displayMessages function at the bottom of the file, to display all Messages
        displayMessages();

      });


      //this is called when the user logs in with an existing account
      //the 'login' event is passed to the server
      //It contains the given username and boolean which is true if a username was given or fals if none was given
      //It hides the loginContainer and shows the main chat page.
      //We also save the local username on the local client
      loginForm.submit(function(e){
      e.preventDefault();
      console.log("trigger emit login");
      socket.emit('login', username.val(),password.val(), function(data){
        if(data){
            loginFormContainer.hide();
            messageContainer.show();
            footer.show();
            allChatsWrapper.show();
            onlineUsersWrapper.show();
            localUser = username.val();
        } else {
          alert("wrong username or password");
        }
      });
    });

    //this is called when a user creates a new account
    newAccountButton.click(function(){
      console.log("new account button clicked");
      var placeholder ="";
      convertImageToString(placeholder,function(){
        const sleep = (milliseconds) => {
            return new Promise(resolve => setTimeout(resolve, milliseconds))
          }
          sleep(500).then(() => {
            console.log("base64 string befor emit: " + base64String);
            if(newUsername.val()===""|| newPassword ===""){
              alert("please enter a name passsword and upload a profile picture");
            }else{
              socket.emit("new account", newUsername.val(), newPassword.val(), base64String, function(data){
                if(data){
                  loginFormContainer.hide();
                  messageContainer.show();
                  footer.show();
                  allChatsWrapper.show();
                  onlineUsersWrapper.show();
                  localUser = username.val();
                } else {
                  alert("pleas enter a name passsword and upload a profile picture");
                }
              });
            }
            
          });
        
    
      });
      
    });

    //this is called to show all the users
    //the server returns a list with all the users so we can loop through it and display the names
    //the children().unbind() call removes a previously attached event handler from the element
    socket.on('get users', function(data){
      users.children().unbind();

      //this creates the div in which the user is displayed, with his username, id and displayed name
      users.html('');
      for ( i = 0; i < data.length; i++){
        if(data[i][1] === localId){
          users.append('<div class="userNameDivMe" username="' +data[i][0] + '" id="' + data[i][1] +  '">' + data[i][0] +'</div>');
        } else {
        users.append('<div class="userNameDiv" username="' +data[i][0] + '" id="' + data[i][1] +  '">' + data[i][0] +'</div>');
      }
    }

        //this calls a clickevent, in which we are able to add a user to a new chat
        //the selectedMode allows us to repeat the event, so we can add more than one user to our chat
        users.children().click(function(){
          if(selectMode){
            //this prevents the user to pick himself when he selectes the members of the new chat
            for(var i = 0; i< 1; i++) {
              if(this.id !== newChatData[i]){
                chosenUsers.append('<div class = "' + this.id + '">' + $(this).attr("username") + '</div>');
                //Shows the continue button with is click event
                continueButton.show();
                //Removes the button at the end of the loop so it wont double itself at a new interval
                continueButton.off();
                //saves the chooosen user id to the chat array
                newChatData.push(this.id);
                break;
              }
            }

            //this clickevent allows to enter the name of the new chat and also displays the picked users
            continueButton.click(function(){
                $('#instructionsForCreatingNewChat').text("Type in a name for the chat");
                chatName.show();
                //When the chat gets his name, he will be given an unique ID
                if(chatName.val()){
                 chatID = generateChatID();
                 //The name and the new ID will be shifted at the front of the dataArray, the new chat has.
                 newChatData.unshift(chatName.val());
                 newChatData.unshift(chatID);
                 //Removes the users fromt the selection to prevent doubling when another cheat is created
                 chosenUsers.children().empty();
                 selectChatMembers.hide();
                 chatName.val('');
                 socket.emit('new chat', newChatData);
                }
            });
          }
        });
    });

    //this is called when a new chat is created
    //the server returns the uniqueChatID and the chat name of the new chat
    socket.on('create chat', function(uniqueChatID,chatName){
      //the new chat will be appended to the parentdiv and get their own div
      //in which the tabindex, uniqueChatID, chatID and their name is displayed
      allChatsContainer.append('<div class="singleChatRoom" tabindex= "' + 0 + '" id="' + uniqueChatID + '" chatID="' + chatID + '">' + chatName + '</div>');
      //the children().unbind() call removes a previously attached event handler from the element
      allChatsContainer.children().unbind();
      //this calls a clickevent, which chooses the chat in which the user will send his message
      allChatsContainer.children().click(function(){
      //the chat ID is saved in a client variable
      tempChatID = this.id;
      //this changes the chat title to the last recent clicked chat, which will also be the chat the user is typing in
      chatTitle.text($(this).text());
      //calls the displayMeessages function
      displayMessages();
      });
    });
    //recognizes connection of a new user and notices all users about it
    //the given data contains the users name
    socket.on('new connection', function(data){
      chatMessages.append('<div class="userUpdate">' + data + " has joined the chat" +'</div>');
    });
    //recognizes disconnection of a new user and notices all users about it
    //the given data contains the users name
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
        if(chatMessages.children().eq(index).attr("messageID") == tempChatID || chatMessages.children().eq(index).attr("class") == "userUpdate"){
          chatMessages.children().eq(index).show();
        } else {
          chatMessages.children().eq(index).hide();
        }
      }
    }

    function convertImageToString(placeholder,callback){
      console.log("inside convert image to string");
      if(uploadedFile.files[0] === undefined){
        alert("pleas enter a name passsword and upload a profile picture");
      } else{
        var file = uploadedFile.files[0];
        console.log("file: " + file);
        var reader = new FileReader();
        reader.onload = function(){
          base64String = reader.result;
          setBaseString(base64String);
        }
        reader.readAsDataURL(file);
        callback();
      }
   
    }

    function setBaseString(stringFromImage){
      this.base64String = stringFromImage;
      console.log("base64 string in setter: " + base64String);
    }


  });//end of big function ALWAYS NEEDS TO BE HERE!
