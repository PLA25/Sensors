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

/* API Connection */
const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
});

const distance = require('fast-haversine');
app.get('/:lat/:long', (req, res) => {
  const nodes = [
    // Paris
    {
      id: 1,
      lat: 48.856614,
      lon: 2.352222
    },

    // Berlin
    {
      id: 2,
      lat: 52.520007,
      lon: 13.404954
    },

    // Wenen
    {
      id: 3,
      lat: 48.208174,
      lon: 16.373819
    },

    // New York
    {
      id: 4,
      lat: 40.712775,
      lon: -74.005973
    }
  ];

  const data = {};
  data[1] = [
    {
      temp: 2
    },
    {
      temp: 1
    }
  ];
  data[2] = [
    {
      temp: -2
    },
    {
      temp: -3
    }
  ];
  data[3] = [
    {
      temp: -6
    },
    {
      temp: -4
    }
  ];

  const closestNodes = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];

    const from = {
      lat: node.lat,
      lon: node.lon
    };

    const to = {
      lat: parseFloat(req.params.lat, 10),
      lon: parseFloat(req.params.long, 10)
    }

    const dist = distance(from, to);

    node.dist = dist;
    closestNodes.push(node);
  }

  const selectedNodes = closestNodes.sort((a, b) => {
    return a.dist - b.dist;
  }).slice(0, 3);

  const divider = (1 / selectedNodes[0].dist) + (1 / selectedNodes[1].dist) + (1 / selectedNodes[2].dist);

  var calculatedValue = 0;
  for (var i = 0; i < selectedNodes.length; i++) {
    var node = selectedNodes[i];

    var weight = (1 / node.dist) / divider;
    var value = data[node.id][0].temp * weight;

    calculatedValue += value;
  }

  res.send({
    temp: calculatedValue
  });
})

app.listen(80, () => console.log('Example app listening on port 3000!'))