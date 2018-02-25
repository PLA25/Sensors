/* Database */
const Config = require('./../config');
const mongoose = require('mongoose');
const DB = mongoose.connect(`mongodb://${Config.MongoDB.User}:${Config.MongoDB.Pass}@${Config.MongoDB.Host}:${Config.MongoDB.Port}/${Config.MongoDB.Name}`);

var Schema = mongoose.Schema;

const sensorHubScheme = new Schema({
  SerialID: {
    type: String,
    required: true
  },
  Latitude: {
    type: String,
    required: true
  },
  Longitude: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('SensorHub', sensorHubScheme);
