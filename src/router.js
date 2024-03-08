const express = require('express');
const renderer = require('./renderer');

function asyncwrap(fn) { return function (req, res, next) { fn(req, res, next).catch(next); } }

function createRouter() {

  const router = express.Router();

  router.get  ('/api/render-image',   setTimeout, validate,  asyncwrap(renderer.renderUrlToImage));

  return router;

  function setTimeout(req, res, next){
    req.setTimeout(15*60*1000);
    next();

  }

  function validate(req, res, next){
    next();
  }
}

module.exports = createRouter;
