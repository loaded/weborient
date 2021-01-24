const http = require('http');
const handi = require('./handicraft.js');
const Router = require('./router.js'); 
const server = http.createServer(myApp);
var io = require('socket.io')(server);

io.on('connection',function(socket){
  socket.on('g-upload',handi.upload.call(socket));
  socket.on('g-start',handi.start.call(socket));  
  socket.on('archive',handi.archive.call(socket))
})

server.listen(3000);




function myApp(req,res){
  Router.process(req,res);
}



