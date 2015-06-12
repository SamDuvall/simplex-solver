var cluster = require('cluster');
var config = require('../config');

var numWorkers = config.numWorkers;
if (numWorkers && cluster.isMaster) {
  // Fork initial workers
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('disconnect', function(worker) {
    console.error('Worker ' + worker.id + ' disconnected!');
    cluster.fork();
  });

  cluster.on('exit', function(worker) {
    console.error('Worker ' + worker.process.pid + ' died!');
  });
} else {
  require('./worker');
}
