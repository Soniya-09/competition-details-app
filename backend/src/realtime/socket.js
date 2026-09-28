const { Server } = require('socket.io');
const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');
const { events, EVENTS } = require('./events');

const room = (competitionId) => `competition:${competitionId}`;

function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') },
  });

  io.on('connection', (socket) => {
    socket.on('competition:subscribe', (competitionId) => {
      if (mongoose.isValidObjectId(competitionId)) socket.join(room(competitionId));
    });
    socket.on('competition:unsubscribe', (competitionId) => socket.leave(room(competitionId)));
  });

  const onAvailability = (payload) => io.to(room(payload.competitionId)).emit('availability', payload);
  events.on(EVENTS.AVAILABILITY_CHANGED, onAvailability);

  logger.info('realtime attached');
  return {
    io,
    close: () => {
      events.off(EVENTS.AVAILABILITY_CHANGED, onAvailability);
      return new Promise((resolve) => io.close(() => resolve()));
    },
  };
}

module.exports = { attachRealtime };
