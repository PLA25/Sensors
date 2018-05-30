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

var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(5, 'out'); //use GPIO pin 4, and specify that it is output
var blinkInterval = setInterval(blinkLED, 250); //run the blinkLED function every 250ms

function blinkLED() { //function to start blinking
  if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or off)
    LED.writeSync(1); //set pin state to 1 (turn LED on)
  } else {
    LED.writeSync(0); //set pin state to 0 (turn LED off)
  }
}

function startBlink() {
  setInterval(blinkLED, 250);
}

function endBlink() { //function to stop blinking
  clearInterval(blinkInterval); // Stop blink intervals
  LED.writeSync(0); // Turn LED off
}

socket.on('connect', () => {
  console.log("Connected");
  endBlink();
});

const exec = require('child_process').exec;

function execute(command, callback) {
  exec(command, function(error, stdout, stderr) {
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
  startBlink();
});

const {
  spawn,
} = require('child_process');

const weekNumber = require('current-week-number');

fs.watchFile('data.json', (curr, prev) => {
  var data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

  for (var i = 0; i < data.length; i++) {
    const date = Date.now();
    data[i].timestamp = date;

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
    py.stdout.on('data', (rawData) => {
      dataString += rawData.toString();
    });

    py.stdout.on('end', () => {
      try {
        const output = JSON.parse(dataString)[0];
        data[i].inMargin = output;
      } catch (e) {
        data[i].inMargin = 0;
      } finally {
        console.log(data[i]);
        socket.emit('newData', data[i]);
      }
    });

    py.stdin.write(JSON.stringify(pyData));
    py.stdin.end();
  }
});
