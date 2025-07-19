const path = require('path');
const { createServer } = require('http');

// Import server.mjs menggunakan dynamic import
import('./server.mjs')
  .then(module => {
    console.log('Server started successfully');
  })
  .catch(err => {
    console.error('Failed to start server:', err);
  });