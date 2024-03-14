const express = require('express');
const path = require('path');
const app = express();
const port = 9090;

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/dist/test/index.html'));
});
app.use(express.static(path.join(__dirname, '/dist/test/')))
app.listen(port, () => console.log("server started"));
