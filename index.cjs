const http = require('http');
const { server: WebSocketServer } = require('websocket');

const {
  generateClientId,
  addClientToRoom,
  removeClientFromRoom,
  broadcastToRoom
} = require('./hooks/room-manager.cjs');

const {
  generateRoomCode,
  createGame,
  joinGame,
  submitWord,
  removePlayerFromGame
} = require('./hooks/game-hooks.cjs');

const PORT = process.env.PORT || 5500;

const httpServer = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`WebSocket server running at ${PORT}`);
    return;
  }
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('WebSocket server only');
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket server listening on ${PORT}`);
});

const wsServer = new WebSocketServer({ httpServer });

const sendEvent = (connection, type, data = null) => {
  if (!connection || !connection.connected) return;
  try {
    connection.sendUTF(JSON.stringify({ type, data }));
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

const handleHostGame = (connection, clientId) => {
  const roomCode = generateRoomCode();
  const { success, error } = createGame(roomCode, clientId);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  addClientToRoom(roomCode, clientId, connection);
  sendEvent(connection, 'gameHosted', { roomCode });
  console.log(`Client ${clientId} created room ${roomCode}`);
};

const handleJoinGame = (connection, clientId, data) => {
  const requestedCode = (data?.roomCode || '').toUpperCase();
  if (!requestedCode) {
    sendEvent(connection, 'joinError', 'Room code required');
    return;
  }

  const { success, error, state } = joinGame(requestedCode, clientId);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  addClientToRoom(requestedCode, clientId, connection);
  sendEvent(connection, 'gameJoined', { roomCode: requestedCode });
  broadcastToRoom(requestedCode, {
    type: 'startGame',
    data: {
      words: state.words,
      history: state.history,
      tiles: state.tiles
    }
  });
  console.log(`Client ${clientId} joined room ${requestedCode}`);
};

const handleSubmitWord = (connection, clientId, data) => {
  const requestedCode = (data?.roomCode || '').toUpperCase();
  const { word } = data || {};
  if (!requestedCode) {
    sendEvent(connection, 'joinError', 'Room code required');
    return;
  }

  const { success, error, state } = submitWord(requestedCode, clientId, word);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  broadcastToRoom(requestedCode, {
    type: 'wordSubmitted',
    data: {
      words: state.words,
      history: state.history,
      tiles: state.tiles
    }
  });
};

const handleClientAction = (connection, clientId, action) => {
  if (!action || typeof action.type !== 'string') {
    sendEvent(connection, 'joinError', 'Invalid payload');
    return;
  }

  switch (action.type) {
    case 'hostGame':
      handleHostGame(connection, clientId);
      break;
    case 'joinGame':
      handleJoinGame(connection, clientId, action.data);
      break;
    case 'submitWord':
      handleSubmitWord(connection, clientId, action.data);
      break;
    default:
      sendEvent(connection, 'joinError', `Unknown action ${action.type}`);
  }
};

const cleanupClient = (clientId) => {
  const removed = removeClientFromRoom(clientId);
  if (!removed) return;
  removePlayerFromGame(removed.roomCode, clientId);
  console.log(`Client ${clientId} left room ${removed.roomCode}`);
};

wsServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);
  const clientId = generateClientId();
  console.log(`Client connected: ${clientId}`);

  connection.on('message', (message) => {
    if (message.type !== 'utf8') return;
    let payload;
    try {
      payload = JSON.parse(message.utf8Data);
    } catch (error) {
      sendEvent(connection, 'joinError', 'Malformed JSON');
      return;
    }

    handleClientAction(connection, clientId, payload);
  });

  const onClose = () => cleanupClient(clientId);
  connection.on('close', onClose);
  connection.on('error', onClose);
});
