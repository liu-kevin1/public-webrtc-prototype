const express = require("express");
const { ExpressPeerServer } = require("peer");

const app = express();

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

const peerServer = ExpressPeerServer(listener, {
  debug: true,
  path: '/myapp'
});

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.use('/peerjs', peerServer);