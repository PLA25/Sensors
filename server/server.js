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

/* API Connection */
const Config = require('./config');
const express = require('express')
const app = express()

/* Utilities */
const Distance = require('fast-haversine');
const GeoCoder = require('node-geocoder')({
  provider: 'google',
  /* Provider Specific */
  httpAdapter: 'https',
  apiKey: Config.GoogleKey,
  formatter: null
});

app.get('/', (req, res) => {
  res.send('Hello World!')
});

const City = require('./models/city');

app.get('/:city', (req, res) => {
  const cityName = req.params.city;

  City.findOne({
    'Name': cityName
  }, (err, city) => {
    if (err) {
      res.send(err);
      return;
    }

    if (city) {
      res.redirect('/' + city.Latitude + '/' + city.Longitude);
      return;
    }

    /* Create new City */
    if (!city) {
      city = new City();
      city.Name = cityName;

      GeoCoder.geocode(city.Name)
        .then((data) => {
          city.Latitude = data[0].latitude;
          city.Longitude = data[0].longitude;
          city.save();
        })
        .then(() => {
          res.redirect('/' + city.Latitude + '/' + city.Longitude);
        })
        .catch((err) => {
          res.send(err);
        });
    }
  });
});

app.get('/:lat/:long/:type', (req, res) => {
  SensorHub.find({}, (err, sensorHubs) => {
    if (err) {
      return res.send(err);
    }

    const latitude = parseFloat(req.params.lat);
    const longitude = parseFloat(req.params.long);

    const calculatedHubs = [];
    for (var i = 0; i < sensorHubs.length; i++) {
      const sensorHub = sensorHubs[i];

      const from = {
        lat: parseFloat(sensorHub.Latitude, 10),
        lon: parseFloat(sensorHub.Longitude, 10)
      };

      const to = {
        lat: parseFloat(latitude, 10),
        lon: parseFloat(longitude, 10)
      }

      sensorHub.Distance = Distance(from, to);
      calculatedHubs.push(sensorHub);
    }

    const selectedNodes = calculatedHubs.sort((a, b) => {
      return a.Distance - b.Distance;
    }).slice(0, 3);

    var divider = 0;
    for (var i = 0; i < selectedNodes.length; i++) {
      divider += (1 / parseFloat(selectedNodes[i].Distance, 10));
    }

    var calculatedValue = 0;

    var promises = [];
    for (var i = 0; i < selectedNodes.length; i++) {
      promises.push(GetData({
        'Type': req.params.type,
        'SensorHub': selectedNodes[i].SerialID
      }));
    }

    Promise.all(promises)
      .then((data) => {
        var calculatedValue = 0;
        for (var i = 0; i < data.length; i++) {
          const dataNode = data[i];
          const sensorHub = selectedNodes[i];

          const weight = (1 / sensorHub.Distance) / divider;
          calculatedValue += (parseFloat(dataNode["Value"], 10) * weight);
        }

        res.send({
          Value: calculatedValue,
          UsedHubs: selectedNodes
        });
      })
      .catch((err) => {
        return res.send(err);
      });
  });
});

function GetData(options) {
  return new Promise(function(resolve, reject) {
    Data.findOne(options, (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data);
    });
  });
}

app.listen(80, () => console.log('API listening on port 80!'))
