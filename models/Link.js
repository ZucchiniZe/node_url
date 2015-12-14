'use strict';

const mongoose = require('mongoose-q')();
const shortid = require('shortid');

const Schema = mongoose.Schema;

const linkSchema = new Schema({
  long_url: { type: String, unique: true },
  short_url: { type: String, unique: true, default: shortid.generate },
  hits: { type: Number, default: 0 },
  creation_trys: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Link', linkSchema);
