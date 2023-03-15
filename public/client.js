// Import Peer
let Peer = window.Peer;

// For displaying text data
let messagesElement = document.querySelector(".messages-body");

// For reading in the ID to connect to
let peerIdElement = document.querySelector("#connectID");

// Write data to the site
let writeData = (message) => {
  let newMessage = document.createElement("div");
  newMessage.innerText = message;
  messagesElement.appendChild(newMessage);
};

// Store the current unused video elements
let elements = 0;
let freeVideoElements = [];

// Create a new video element under main
let createFreeVideoElement = () => {
  var tree = document.createDocumentFragment();
  var video = document.createElement("video");
  video.setAttribute("class", "border remote-video" + elements);
  video.setAttribute("autoplay", true);

  tree.appendChild(video);
  document.getElementById("main").appendChild(tree);

  elements++;

  return video;
};

// Get a free video element, returning a new element if there are no more available
let getFreeVideoElement = () => {
  let el = freeVideoElements.pop();
  if (el == undefined) {
    el = createFreeVideoElement();
  }
  return el;
};

// Create a new Peer object
let peer = new Peer({
  host: "/",
  path: "/peerjs/myapp",
});

// Store current connections
let connections = [];
// Store current streams
let streams = [];

// Allocate a stream to a video element, returning -1 if there are no more free elements
let renderVideo = (stream) => {
  if (streams.indexOf(stream) == -1) {
    streams.push(stream);
    console.log("rendering " + stream);
    let el = getFreeVideoElement();
    console.log(el);
    el.srcObject = stream;
  }
};

// Given a list <data> of IDs, check which ones aren't connected to yet and connect to them
let connectToOthers = (data) => {
  for (let i = 0; i < data.length; i++) {
    console.log("Connect to " + data[i] + " ?");
    if (data[i] != peer.id && connections.indexOf(data[i]) == -1) {
      console.log("Connecting to " + data[i] + " !");
      createPeerConnection(data[i]);
    }
  }
};

// Send outgoing connection
let createPeerConnection = (id) => {
  let peerId = id || peerIdElement.value;
  writeData("Connecting to " + peerId);

  if (connections.indexOf(peerId) != -1) {
    return -1;
  }

  connections.push(peerId);
  let conn = peer.connect(peerId);
  console.log(connections);

  conn.on("data", (data) => {
    console.log(data);
    connectToOthers(data);
  });

  conn.on("open", () => {
    conn.send(connections);
  });

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      let call = peer.call(peerId, stream);
      call.on("stream", renderVideo);
    })
    .catch((err) => {
      console.error("Error: Unable to get local stream", err);
    });
};

// Attach to Peer events
peer.on("open", (id) => {
  writeData("Room ID: " + id);
});

peer.on("error", (error) => {
  console.error(error);
});

// For incoming data connections
peer.on("connection", (conn) => {
  console.log(conn);

  // Make sure the client's ID isn't being sent back
  let incomingId = conn.peer;
  if (incomingId != peer.id) {
    connections.push(incomingId);
  }
  console.log(connections);

  // Given data, try and connect to the IDs
  conn.on("data", (data) => {
    console.log(data);
    connectToOthers(data);
  });

  conn.on("open", () => {
    conn.send(connections);
  });
});

// For incoming audio/visual connections
peer.on("call", (call) => {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      call.answer(stream);
      call.on("stream", renderVideo);
    })
    .catch((err) => {
      console.error("Error: Unable to get local stream", err);
    });
});

// Render the client's stream
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    renderVideo(stream);
  });

window.createPeerConnection = createPeerConnection;
