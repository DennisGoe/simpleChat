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
  console.log(amountConnections.length + " sockets are connected");
  
//once a user disconnects the connection is removed from the list and the list of online users is updated
  socket.on('disconnect', function(data){
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
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

  //is triggered once the user log into the system. it pushes the user to the list and updates the list of online users in the frontend
  //also we give the socket the username 
  //the parameters are function(username, enteredDara is set to true once the user has entered a name)
  socket.on('new user', function(data, enteredData){
    enteredData(true);
    socket.username = data;
    users.push(socket.username);
    updateUsernames();
  });

  //updates the list of user. Returns the current list of users to the client.
  function updateUsernames(){
    io.sockets.emit('get users', users);
  }
  
});