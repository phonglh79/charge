'use strict';

const cluster = require('cluster');
module.exports = agent => {
  agent.messenger.on('egg-ready', (data) => {
    agent.messenger.sendRandom('init-job', data);
  });
  agent.messenger.on('egg-pids', (pids) => {
  });
};