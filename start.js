//express
var express = require('express');
var app = express();
//create server
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;
//contains all online users
users = [];
//responsible for connected sockets
amountConnections = [];

//all group chats
allGroupChats = [];



//server listens on port 3000
server.listen(port);
console.log('Server running on port:  ' + port);

//use static files like additional javascript files or css files linked in the html file
app.use(express.static('./'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/' + 'index.html');
});





//is triggered once a sockets connects
//the connection is then pushed to the 'amountConnections' array and is stored until user disconnects
io.sockets.on('connection', function(socket){
  amountConnections.push(socket);
  


//once a user disconnects the connection is removed from the list and the list of online users is updated
  socket.on('disconnect', function(e){

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
    console.log("chatID " + chatID);
    if(chatID === "globalChat"){
      io.sockets.emit('new message',{msgContent: data, username: socket.username,chatID: chatID});
      console.log(data);
    } else{
      console.log("inside else");
      for (let x = 0; x < allGroupChats.length; x++) {
        console.log("all members of grup chat: " + allGroupChats[x]);
        console.log("amount of groups: " + allGroupChats.length);
        console.log("all chat IDs: " + allGroupChats[x][0]);
        if(allGroupChats[x][0] === chatID){
          
          for (let y = 2; y < allGroupChats[x].length; y++) {

            io.to(allGroupChats[x][y]).emit('new message',{msgContent: data, username: socket.username,chatID: chatID});
          }
        }

      }
    }
  });

  //is triggered once the user logs into the system. it pushes the user to the list and updates the list of online users in the frontend
  //also we give the socket the username
  //the parameters are function(username, enteredDara is set to true once the user has entered a name)
  socket.on('new user', function(data, enteredData){
    //declare a single user variable so we can store both the name and the socket id
    //in it for the multicasts
    var singleUser = [];
    enteredData(true);
    socket.username = data;
    singleUser[0] = data;
    singleUser[1] = amountConnections[amountConnections.length - 1].id;
    users.push(singleUser);
    updateUsernames();
    io.sockets.emit('new connection', socket.username);
  });

  //is called when a new chat is created by a user
  //CAUTION!: index = 0 is for the individual chatID
  //          index = 1 is for the name the user has given the chat
  //the remaining indexes are the socket IDs of all the members of that group
  socket.on('new chat',function(chatData){
    allGroupChats.push(chatData);
    for (let index = 2 ; index < chatData.length; index++){
       io.to(chatData[index]).emit('create chat', chatData[1]);
    }
  });

  //updates the list of user. Returns the current list of users to the client.
  function updateUsernames(){

    io.sockets.emit('get users', users);
  }



});
