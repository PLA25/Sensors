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

const LATIUDE = null;
const LONGITUDE = null;

const fs = require('fs');
const socket = require('socket.io-client')('http://127.0.0.1:3000');

socket.on('connect', () => {
  console.log("Connected");
});

const exec = require('child_process').exec;

function execute(command, callback) {
  exec(command, function (error, stdout, stderr) {
    callback(stdout);
  });
};

socket.on('identify', (cb) => {
  // TODO: Get Long Lat
  if (LATIUDE == null || LONGITUDE == null) {
    throw new Error("Fill Lat, Long");
  }

  execute("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2", (SerialID) => {
    cb(SerialID, LATIUDE, LONGITUDE);
  });
});

socket.on('disconnect', () => {
  console.log("Disconnected");
});

const {
  spawn,
} = require('child_process');

fs.watchFile('data.json', (curr, prev) => {
  var data = JSON.parse(fs.readFileSync('data.json', 'utf8'));



  for (var i = 0; i < data.length; i++) {
    data[i]["timestamp"] = Date.now();
    const date = new Date(data[i]["timestamp"]);

    let type = 0;
    if (data.Type === 'temperature') {
      type = 0;
    } else if (data.Type === 'gasses') {
      type = 1;
    } else {
      type = 2;
    }

    const pyData = [
      date.getDay() - 1,
      weekNumber(date),
      date.getUTCHours(),
      type,
      parseInt(data[i].value, 10),
    ];

    const py = spawn('python', ['ml.py']);

    let dataString = '';
    py.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    py.stdout.on('end', () => {
      const output = JSON.parse(dataString)[0];
      data.inMargin = output;

      socket.emit('newData', data);
    });

    py.stdin.write(JSON.stringify(pyData));
    py.stdin.end();
  }
});
