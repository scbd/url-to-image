const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const cors = require('cors');
const winston = require('./logger')(__filename);
const createRouter = require('./router');
const config = require('./config');

function createApp() {
  const app = express();
  app.use(morgan('common'));

  if (config.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  const corsOpts = {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'OPTIONS', 'HEAD'],
  };
  winston.info('Using CORS options:', corsOpts);
  app.use(cors(corsOpts));
  
  app.use(compression({threshold: 100,}));//100kb

  // Initialize routes
  const router = createRouter();
  app.use('/', router);

  return app;
}

module.exports = createApp;
