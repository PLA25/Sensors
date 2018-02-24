/*
  Client-Side code of the Sensor hub.
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

const fs = require('fs');

const socket = require('socket.io-client')('http://127.0.0.1:3000');

socket.on('connect', () => {
  console.log("Connected");
});

socket.on('identify', (cb) => {
  // TODO: Get serial from RPI (cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2)
  // TODO: Get Long Lat
  cb("00000000f40d68ca-" + getRandomInt(10), 10, 2);
});

socket.on('disconnect', () => {
  console.log("Disconnected");
});

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

fs.watchFile('data.json', (eventType, filename) => {
  socket.emit('newData', JSON.parse(fs.readFileSync(filename, 'utf8')));
});
