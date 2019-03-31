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
  console.log("id of newly connected socket: " + socket.id);
  amountConnections.push(socket);
  console.log(amountConnections.length + " sockets are connected");
  for (let index = 0; index < amountConnections.length; index++) {
    console.log("sockets in array: " +  amountConnections[index].id);
  }
  console.log("==================================");
  


//once a user disconnects the connection is removed from the list and the list of online users is updated
  socket.on('disconnect', function(e){
 
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    
    io.sockets.emit('disconnect', socket.username);
    //remove connection from list
    amountConnections.splice(amountConnections.indexOf(socket), 1);
    console.log(amountConnections.length + " sockets are connected");
  });
 
  //is triggered once a message is sent. the 'send message' event is getting emitted to the client
  //the callback function sends 'data' --> the messga it self and the username of the sender
  //the client creates a div that contains these data then
  socket.on('send message', function(data){
    io.sockets.emit('new message',{msgContent: data, username: socket.username});
  });

  //is triggered once the user logs into the system. it pushes the user to the list and updates the list of online users in the frontend
  //also we give the socket the username
  //the parameters are function(username, enteredDara is set to true once the user has entered a name)
  socket.on('new user', function(data, enteredData){
    //declare a single user variable so we can store both the name and the socket id 
    //in it for the multicasts
    var singleUser = [];
    console.log("the user: " + data + " has been assigned the ID: "+ socket.id);
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
    console.log("this is the data for a new chat:" + chatData);
    allGroupChats.push(chatData);
    for (let index = 2 ; index < chatData.length; index++){
       io.to(chatData[index]).emit('create chat', chatData[1]);
    }
  });

  //updates the list of user. Returns the current list of users to the client.
  function updateUsernames(){

    console.log("WE ARE NOW IN THE UPDATE FUNCTION");
    for (let index = 0; index < users.length; index++) {
      console.log("user: " + users[index][0] + " has the id " + users[index][1]);
    }
    io.sockets.emit('get users', users);
  }



});
