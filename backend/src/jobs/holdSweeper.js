const registrationService = require('../services/registrationService');
const logger = require('../utils/logger');

function startHoldSweeper(intervalMs) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const released = await registrationService.sweepExpiredHolds();
      if (released) logger.info({ released }, 'released expired payment holds');
    } catch (err) {
      logger.error({ err }, 'hold sweep failed');
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  tick();
  return () => clearInterval(timer);
}

module.exports = { startHoldSweeper };
