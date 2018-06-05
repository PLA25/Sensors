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

/* Sensor Connection */
const io = require('socket.io')(3000);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* Models */
const Data = require('./models/data');
const SensorHub = require('./models/sensorhub');

io.on('connect', (socket) => {
  socket.emit('identify', (SerialID, latitude, longitude) => {
    console.log(`SensorHub connected ${SerialID} on Lat: ${latitude} and Long: ${longitude}`);

    socket.SerialID = SerialID;

    SensorHub.findOne({
      'SerialID': SerialID
    }, (err, sensorHub) => {
      if (err) {
        return;
      }

      /* Create new SensorHub */
      if (!sensorHub) {
        sensorHub = new SensorHub();
        sensorHub.SerialID = SerialID;
        sensorHub.Latitude = latitude;
        sensorHub.Longitude = longitude;
        sensorHub.save();
      }
    });
  });

  socket.on('newData', (rawData) => {
    for (var i = 0; i < rawData.length; i++) {
      var nodeData = rawData[i];

      var data = new Data();
      data.SensorHub = socket.SerialID;
      data.Type = nodeData.type;
      data.Timestamp = nodeData.timestamp;
      data.Value = nodeData.value;
      data.inMargnin = nodeData.inMargin;
      if(data.inMargin == 0) {
        const msg = {
          to: 'mail@mvegter.mem',
          from: 'warning@pds.com',
          subject: 'Detection Warning!',
          text: `Please visit the portal for more information. SensorHub: ${data.SensorHub}, Time: ${data.Timestamp}, Type: ${data.Type} and Value: ${data.Value}`,
          html: `Please <strong>visit the portal</strong>for more information SensorHub: ${data.SensorHub}, Time: ${data.Timestamp}, Type: ${data.Type} and Value: ${data.Value}`,
        };
        sgMail.send(msg);
      }
      
      data.save();
    }
  });

  socket.on('disconnect', (reason) => {
    // TODO: Something??
  });
});
