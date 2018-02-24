/*
  Server-Side code of the Sensor hub.
  Copyright (C) 2018  Martijn Vegter

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const io = require('socket.io')(3000);

io.on('connect', (socket) => {
  console.log("New Connection");

  socket.emit('identify', (serial, long, lat) => {
    socket.SerialID = serial;

    var node = serial + " | " + long + ", " + lat;
        node = {
          ID: serial,
          Content: node
        };

    io.emit('newNode', node);
  });

  socket.on('newData', (data) => {
    console.log(data);
  });

  socket.on('disconnect', (reason) => {
    io.emit('remNode', socket.SerialID);
  });
});
