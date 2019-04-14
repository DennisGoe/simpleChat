//express
var express = require('express');
var app = express();
//create server
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
let port = process.env.PORT || 3000;
//array that contains all online users
users = [];
//array that is responsible for connected sockets
amountConnections = [];
//array that contains all group chats
allGroupChats = [];

const fetch = require("node-fetch");
const bodyParser = require('body-parser');

var mood ="";
//server listens on port 3000
server.listen(port);
console.log("listening port " + port);
//use static files like additional javascript files or css files linked in the html file
app.use(express.static('./'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/' + 'index.html');
});





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
     getTone(data);  

     const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    sleep(700).then(() => {
      console.log("the mood in send message is: " + mood);
      //Every user is getting the global chat message
    if(chatID === "globalChat"){
      io.sockets.emit('new message',{msgContent: data, username: socket.username,chatID: chatID, mood: mood});
    //iterates threw all chats on the server and checks if a user is inside the chat, so he will get the message inside that specific chat
    } else {
      for (let x = 0; x < allGroupChats.length; x++) {
        if(allGroupChats[x][0] === chatID){
          //The first two indexes are reserved for chat id and name, so the first user is displayed at the second index
          for (let y = 2; y < allGroupChats[x].length; y++) {
            //Emits the message to all users in the specific chat
            io.to(allGroupChats[x][y]).emit('new message',{msgContent: data, username: socket.username,chatID: chatID, mood: mood});
          }
        }
      }
    }
    })
    

    
  });

  //is triggered once the user logs into the system. it pushes the user to the list and updates the list of online users in the frontend
  //also we give the socket the username
  //the parameters are function(username, enteredDara is set to true once the user has entered a name)
  socket.on('new user', function(data, enteredData){
    //declare a single user variable so we can store both the name and the socket id
    //in it for the multicasts
    var singleUser = [];
    //if a user did not chose a name he will recive User*randomNumber*
    if(data === ''){
        data = "User" + (Math.floor(Math.random() * (+999999 - +100)) + +100);
    }
    enteredData(true);
    socket.username = data;
    //Sets the variables in the array for the mulitcasts
    singleUser[0] = data;
    singleUser[1] = amountConnections[amountConnections.length - 1].id;
    //Adds the user to the server list
    users.push(singleUser);
    updateUsernames();
    //Multicasts the new connections with the socket name to all users
    io.sockets.emit('new connection', socket.username);
  });

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
