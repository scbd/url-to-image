const path = require('path');
const winston = require('winston');
const config = require('./config');

const COLORIZE = config.NODE_ENV === 'development';

function createLogger(filePath) {
  const fileName = path.basename(filePath);

  const logger = new winston.Logger({
    transports: [new winston.transports.Console({
      colorize: COLORIZE,
      label: fileName,
      timestamp: true,
    })],
  });

  _setLevelForTransports(logger, config.LOG_LEVEL || 'info');
  return logger;
}

function _setLevelForTransports(logger, level) {
  Object.keys(logger.transports).forEach((key) => {
    const transport = logger.transports[key];
    transport.level = level;
  });
}

module.exports = createLogger;
