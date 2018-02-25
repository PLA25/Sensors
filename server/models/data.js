/* Database */
const Config = require('./../config');
const mongoose = require('mongoose');
const DB = mongoose.connect(`mongodb://${Config.MongoDB.User}:${Config.MongoDB.Pass}@${Config.MongoDB.Host}:${Config.MongoDB.Port}/${Config.MongoDB.Name}`);

var Schema = mongoose.Schema;

const dataScheme = new Schema({
  Type: {
    type: String,
    required: true
  },
  Timestamp: {
    type: Date,
    required: true
  },
  Value: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Data', dataScheme);
