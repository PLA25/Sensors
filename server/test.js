const socket = require('socket.io-client')('http://127.0.0.1:3000');

socket.on('connect', () => {
  console.log("Connected");
  
  socket.emit('newData', {
    SerialID: 'test',
    Type: 'temperature',
    Timestamp: new Date().getTime(),
    Value: 500,
    inMargin: 0,
  });
});