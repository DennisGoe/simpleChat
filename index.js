//express
var express = require('express');
var app = express();
//create server
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
let port = process.env.PORT || 3000;
console.log("before request is created");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = new XMLHttpRequest();
var tokenString ="";
var LanguageTranslatorV3 = require('watson-developer-cloud/language-translator/v3');



//array that contains all online users
users = [];
//array that is responsible for connected sockets
amountConnections = [];
//array that contains all group chats
allGroupChats = [];

const fetch = require("node-fetch");
const bodyParser = require('body-parser');

var translation ="";
var mood ="";
var loginSuccess = false;
var createdAccount = false;







//server listens on port 3000
server.listen(port);
console.log("listening port " + port);

//use static files like additional javascript files or css files linked in the html file
app.use(express.static('./'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/' + 'index.html');
});
//===================DO NOT TOUCH!!=================

console.log("calling to get token");
getToken();

// const sleep = (milliseconds) => {
//   return new Promise(resolve => setTimeout(resolve, milliseconds))
// }
// sleep(3000).then(() => {
//   sendTestSSQL();
// });


//====================================================


//is triggered once a sockets connects
//the connection is then pushed to the 'amountConnections' array and is stored until user disconnects
io.sockets.on('connection', function(socket){

  amountConnections.push(socket);
  //this sends a singleCast to the new connected user, so he can store his own socket id
  io.to(socket.id).emit('sendLocalId', socket.id);

//once a user disconnects the connection is removed from the list and the list of online users is updated
  socket.on('disconnect', function(e){
    //removes the user
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();

    io.sockets.emit('disconnect', socket.username);
    //remove connection from list
    amountConnections.splice(amountConnections.indexOf(socket), 1);
  });

  //is triggered once a message is sent. the 'send message' event is getting emitted to the client
  //the callback function sends 'data' --> the messga it self and the username of the sender
  //the client creates a div that contains these data then
  socket.on('send message', function(data, chatID){
     getTranslation(data);
     getTone(data);
     const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    sleep(700).then(() => {
      console.log("the mood in send message is: " + mood);
      //Every user is getting the global chat message
    if(chatID === "globalChat"){
      io.sockets.emit('new message',{msgContent: data, username: socket.username,chatID: chatID, mood: mood, translation: translation});
    //iterates threw all chats on the server and checks if a user is inside the chat, so he will get the message inside that specific chat
    } else {
      for (let x = 0; x < allGroupChats.length; x++) {
        if(allGroupChats[x][0] === chatID){
          //The first two indexes are reserved for chat id and name, so the first user is displayed at the second index
          for (let y = 2; y < allGroupChats[x].length; y++) {
            //Emits the message to all users in the specific chat
            io.to(allGroupChats[x][y]).emit('new message',{msgContent: data, username: socket.username,chatID: chatID, mood: mood, translation: translation});
          }
        }
      }
    }
    })



  });

  //is triggered once the user logs into the system. it pushes the user to the list and updates the list of online users in the frontend
  //also we give the socket the username
  //the parameters are function(username, enteredDara is set to true once the user has entered a name)
  socket.on('login', function(username,password, enteredData){
    //declare a single user variable so we can store both the name and the socket id
    //in it for the multicasts
    console.log("login has been called");
    if(username != "" && password !=""){
      console.log("calling checkLogin");
      checkLoginData(username,password,function(){
        if(loginSuccess){
          var singleUser = [];
          enteredData(true);
          socket.username = username;
          //Sets the variables in the array for the mulitcasts
          singleUser[0] = username;
          singleUser[1] = amountConnections[amountConnections.length - 1].id;
          //Adds the user to the server list
          users.push(singleUser);
          updateUsernames();
          //Multicasts the new connections with the socket name to all users
          io.sockets.emit('new connection', socket.username);
          loginSuccess = false;
        }else{
          enteredData(false);
          loginSuccess = false;
        } //end of login success else

      }); //end of checkLogin callback
    } else{
      enteredData(false);
      loginSuccess = false;
    } //end of empty input field else

  });//end of socket.on 'login'

  //is triggered when user creates a new account
  socket.on('new account', function(newUsername, newPassword, profilePictureString,enteredData){
    console.log("on new account string: " + profilePictureString);
    if(newUsername != "" && newPassword != ""){
      createNewUser(newUsername,newPassword,profilePictureString,function(){
        if(createdAccount){
          var singleUser = [];
          enteredData(true);
          socket.username = username;
          //Sets the variables in the array for the mulitcasts
          singleUser[0] = username;
          singleUser[1] = amountConnections[amountConnections.length - 1].id;
          //Adds the user to the server list
          users.push(singleUser);
          updateUsernames();
          //Multicasts the new connections with the socket name to all users
          io.sockets.emit('new connection', socket.username);
          createdAccount = false;
        }else{
          enteredData(false);
          createdAccount = false;
        } //end of login success else

      }); //end of checkLogin callback
    } else {
      enteredData(false);
      createdAccount = false;
    }
  })




  //is called when a new chat is created by a user
  //CAUTION!: index = 0 is for the individual chatID
  //          index = 1 is for the name the user has given the chat
  //the remaining indexes are the socket IDs of all the members of that group
  socket.on('new chat',function(chatData){
    allGroupChats.push(chatData);
    for (let index = 2 ; index < chatData.length; index++){
       io.to(chatData[index]).emit('create chat',chatData[0], chatData[1]);
    }
  });

  //updates the list of user. Returns the current list of users to the client.
  function updateUsernames(){
    io.sockets.emit('get users', users);
  }



  function getTranslation(message){

    const languageTranslator = new LanguageTranslatorV3({
      version: '2019-04-02',
      iam_apikey: '2pqEryqIM5wak7DK6HOnsZkY-6V5bOvSm1Afb30SfV2O',
      url: 'https://gateway-fra.watsonplatform.net/language-translator/api'
    });

    const translateParams = {
      text: JSON.stringify(message),
      model_id: 'en-es'
    };

    languageTranslator.translate(translateParams)
      .then(translationResult => {
          console.log(JSON.stringify(translationResult, null, 2));
          translatedText = JSON.stringify(translationResult);
      })
      .catch(err => {
          console.log('error:', err);
  });

  }



  function getTone(message){
    console.log("get tone is called");
    fetch("https://ecstatic-booth.eu-de.mybluemix.net/tone", {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'mode': 'cors'
      },
      body: JSON.stringify({
         texts: [message, message]
      })

  })

  .then((response) => {
      var contentType = response.headers.get("content-type");
      if(contentType && contentType.includes("application/json")) {
         return response.json();
      }
      throw new TypeError("Oops, we haven't got JSON!");
  })
  .then((response) => {
      console.log("response:" +  JSON.stringify(response));
      if (response.mood) {
        mood = response.mood;
        console.log("author is in this mood: " + response.mood);
        return  mood;
      }
  })
  }
});

//=============================DO NOT TOUCH!!======================
function getToken(){
  console.log('inside get token');
  // var request = new XMLHttpRequest();
  request.open('POST','https://dashdb-entry-fra-fra02-01.services.eu-de.bluemix.net/dashdb-api/v2/auth', true);
  request.setRequestHeader("Content-type", "application/json");
  var data = JSON.stringify({"userid":"dash100604", "password":"y_GpBLH_f7u1"});
  request.send(data);

    request.onload = function(){

      if(request.readyState === 4 ){
        if(request.status === 400){
          var json = JSON.parse(request.responseText);
          console.log(json);
        }
        if(request.status === 200){
          let tokenObject = JSON.parse("[" + request.responseText + "]");
          tokenString = tokenObject[0].token;
          passToken(tokenString);

        }
      }

    }
    
}
//===============================================================


//need this as helper function to set the global variable, because i couldnt access the variable from inside the anonymous function inside getToken()
function passToken(passedToken){
  console.log("Inside pass token");
  tokenString = passedToken;
  console.log("new token: " + tokenString);
}


function checkLoginData(username,password,callback){
  console.log("check login was called");
  var request = new XMLHttpRequest();
  request.open('POST','https://dashdb-entry-fra-fra02-01.services.eu-de.bluemix.net/dashdb-api/v2/sql_query_export',true);

  request.setRequestHeader("Content-type", "application/json");
  request.setRequestHeader('Authorization', 'Bearer ' + tokenString);

  var data = JSON.stringify({"command" : "SELECT PICTURE FROM LOGINSYSTEM WHERE USERNAME='" + username + "' AND PASSWORD ='" + password + "'"});

  request.send(data);

  // console.log("state of login request: " + request);
  //onload
  request.onload = function(){
    if(request.readyState === 4 ){
      if(request.status === 400){
        var json = JSON.parse(request.responseText);
        console.log(json);
      }
      if(request.status === 200){
        var loginData = request.responseText;
        var temp = loginData.slice(9, (loginData.length - 1))
        var strippedString = temp.slice(0,- 1);

        if(strippedString ===""){
          console.log("login failed");
          setLoginSuccess(false);
          callback();
        }
        else{
          console.log("LOGIN DATA: " + strippedString);
          setLoginSuccess(true);
          io.to(amountConnections[amountConnections.length - 1].id).emit('Image data', strippedString);
          callback();
        }

      }
    }

  }

}

function setLoginSuccess(success){
  loginSuccess = success;
}


function createNewUser(newUsername,newPassword,profilePictureString,callback){
  console.log("inside new user function");
  // console.log("profile String: " + profilePictureString);
  console.log(newUsername + ", " + newPassword );

  // var createRequest = new XMLHttpRequest();
  request.open('POST','https://dashdb-entry-fra-fra02-01.services.eu-de.bluemix.net/dashdb-api/v2/sql_jobs',true);

  request.setRequestHeader("Content-type", "application/json");
  request.setRequestHeader('Authorization', 'Bearer ' + tokenString);

  var data = JSON.stringify({"commands" : "INSERT INTO LOGINSYSTEM VALUES('" + newUsername + "','" + newPassword + "','" + profilePictureString +"');",
                             "separator" : ";",
                             "stop_on_error" : "no"});

  request.send(data);
  console.log(request);


  //onload
  request.onload = function(){
    console.log("inside onload of create");
    console.log(request);
    if(request.readyState === 4 ){
      if(request.status === 400){
        console.log("SOMEHOW NOT AVAILABLE");
      }
      if(request.status === 200){
        var createRequest = JSON.parse(request.responseText);

        if(createRequest[0].commands_count === 1){
          console.log("login failed");
          setCreateAccount(false);
          callback();
        }
        else{
          console.log("NEW DATA: " + createRequest);
          setCreateAccount(true);
          callback();
        }

      }
    }

  }
}

function setCreateAccount(success){
  createNewUser = success;
}


//this causes the server to get an new Bearer token every 5 minutes so no session time out can happen.
setInterval(function(){
  getToken();
  
},300 * 1000);