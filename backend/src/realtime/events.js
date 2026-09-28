const { EventEmitter } = require('events');

const events = new EventEmitter();
events.setMaxListeners(50);

const EVENTS = Object.freeze({
  AVAILABILITY_CHANGED: 'competition.availability_changed',
});

module.exports = { events, EVENTS };
