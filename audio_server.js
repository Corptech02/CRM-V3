const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve audio files
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.mp3') {
      res.set('Content-Type', 'audio/mpeg');
    }
  }
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Audio server running on http://162.220.14.239:${PORT}`);
  console.log('MP3 files available at:');
  console.log('- http://162.220.14.239:8080/audio/welcome.mp3');
  console.log('- http://162.220.14.239:8080/audio/have%20a%20good%20day.mp3');
});