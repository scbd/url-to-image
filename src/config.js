const config = {
  PORT: Number(process.env.PORT) ||8500,
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL
};

module.exports = config;
