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
  listOpenGames,
  playAgain,
  submitWord,
  clearRack,
  useBoon,
  useAttack,
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
const connections = new Map();

const sendEvent = (connection, type, data = null) => {
  if (!connection || !connection.connected) return;
  try {
    connection.sendUTF(JSON.stringify({ type, data }));
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

const createGameStatePayload = (state) => ({
  words: state.words,
  history: state.history,
  scores: state.scores,
  lastWordScores: state.lastWordScores,
  lastWordBreakdowns: state.lastWordBreakdowns,
  playAgainVotes: state.playAgainVotes,
  rackClears: state.rackClears,
  cards: state.cards,
  tiles: state.tiles,
  isPrivate: state.isPrivate,
  settings: state.settings,
  overtimeEnabled: state.overtimeEnabled,
  overtimePendingSide: state.overtimePendingSide,
  overtimeFinalWordSubmitted: state.overtimeFinalWordSubmitted,
  submissionPauseOwner: state.submissionPauseOwner || null
});

const createLobbyListPayload = () => ({
  lobbies: listOpenGames()
});

const broadcastLobbyList = () => {
  const payload = createLobbyListPayload();
  for (const connection of connections.values()) {
    sendEvent(connection, 'lobbyList', payload);
  }
};

const handleHostGame = (connection, clientId, data) => {
  const roomCode = generateRoomCode();
  const { success, error, state } = createGame(roomCode, clientId, {
    isPrivate: data?.isPrivate ?? true,
    overtimeEnabled: data?.overtimeEnabled ?? true,
    settings: data?.settings || {}
  });
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  addClientToRoom(roomCode, clientId, connection);
  sendEvent(connection, 'gameHosted', {
    roomCode,
    ...createGameStatePayload(state)
  });
  broadcastLobbyList();
  console.log(`Client ${clientId} created room ${roomCode}`);
};

const handlePlayAgain = (connection, clientId, data) => {
  const requestedCode = (data?.roomCode || '').toUpperCase();
  if (!requestedCode) {
    sendEvent(connection, 'joinError', 'Room code required');
    return;
  }

  const { success, error, state, restarted } = playAgain(requestedCode, clientId);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  if (!state) {
    sendEvent(connection, 'joinError', 'Unable to update replay vote');
    return;
  }

  if (!restarted) {
    broadcastToRoom(requestedCode, {
      type: 'playAgainUpdated',
      data: createGameStatePayload(state)
    });
    return;
  }

  broadcastToRoom(requestedCode, {
    type: 'gameRestarted',
    data: createGameStatePayload(state)
  });
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
  sendEvent(connection, 'gameJoined', {
    roomCode: requestedCode,
    ...createGameStatePayload(state)
  });
  broadcastToRoom(requestedCode, {
    type: 'startGame',
    data: createGameStatePayload(state)
  });
  broadcastLobbyList();
  console.log(`Client ${clientId} joined room ${requestedCode}`);
};

const handleListLobbies = (connection) => {
  sendEvent(connection, 'lobbyList', createLobbyListPayload());
};

const handleSubmitWord = async (connection, clientId, data) => {
  const requestedCode = (data?.roomCode || '').toUpperCase();
  const { word, tileIds, languageCode } = data || {};
  if (!requestedCode) {
    sendEvent(connection, 'joinError', 'Room code required');
    return;
  }

  const { success, error, state } = await submitWord(requestedCode, clientId, word, tileIds, languageCode);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  broadcastToRoom(requestedCode, {
    type: 'wordSubmitted',
    data: createGameStatePayload(state)
  });
};

const handleClearRack = (connection, clientId, data) => {
  const requestedCode = (data?.roomCode || '').toUpperCase();
  if (!requestedCode) {
    sendEvent(connection, 'joinError', 'Room code required');
    return;
  }

  const { success, error, state } = clearRack(requestedCode, clientId);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  broadcastToRoom(requestedCode, {
    type: 'rackCleared',
    data: createGameStatePayload(state)
  });
};

const handleUseBoon = (connection, clientId, data) => {
  const requestedCode = (data?.roomCode || '').toUpperCase();
  const { cardId, tileId } = data || {};
  const { success, error, state } = useBoon(requestedCode, clientId, cardId, tileId);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  broadcastToRoom(requestedCode, {
    type: 'boonUsed',
    data: createGameStatePayload(state)
  });
};

const handleUseAttack = (connection, clientId, data) => {
  const requestedCode = (data?.roomCode || '').toUpperCase();
  const { cardId } = data || {};
  const { success, error, state } = useAttack(requestedCode, clientId, cardId);
  if (!success) {
    sendEvent(connection, 'joinError', error);
    return;
  }

  broadcastToRoom(requestedCode, {
    type: 'attackUsed',
    data: createGameStatePayload(state)
  });
};

const handleClientAction = async (connection, clientId, action) => {
  if (!action || typeof action.type !== 'string') {
    sendEvent(connection, 'joinError', 'Invalid payload');
    return;
  }

  switch (action.type) {
    case 'hostGame':
      handleHostGame(connection, clientId, action.data);
      break;
    case 'joinGame':
      handleJoinGame(connection, clientId, action.data);
      break;
    case 'listLobbies':
      handleListLobbies(connection);
      break;
    case 'submitWord':
      await handleSubmitWord(connection, clientId, action.data);
      break;
    case 'playAgain':
      handlePlayAgain(connection, clientId, action.data);
      break;
    case 'clearRack':
      handleClearRack(connection, clientId, action.data);
      break;
    case 'useBoon':
      handleUseBoon(connection, clientId, action.data);
      break;
    case 'useAttack':
      handleUseAttack(connection, clientId, action.data);
      break;
    default:
      sendEvent(connection, 'joinError', `Unknown action ${action.type}`);
  }
};

const cleanupClient = (clientId) => {
  const removed = removeClientFromRoom(clientId);
  connections.delete(clientId);
  if (!removed) {
    broadcastLobbyList();
    return;
  }
  removePlayerFromGame(removed.roomCode, clientId);
  broadcastLobbyList();
  console.log(`Client ${clientId} left room ${removed.roomCode}`);
};

wsServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);
  const clientId = generateClientId();
  connections.set(clientId, connection);
  console.log(`Client connected: ${clientId}`);
  sendEvent(connection, 'lobbyList', createLobbyListPayload());

  connection.on('message', async (message) => {
    if (message.type !== 'utf8') return;
    let payload;
    try {
      payload = JSON.parse(message.utf8Data);
    } catch (error) {
      sendEvent(connection, 'joinError', 'Malformed JSON');
      return;
    }

    await handleClientAction(connection, clientId, payload);
  });

  const onClose = () => cleanupClient(clientId);
  connection.on('close', onClose);
  connection.on('error', onClose);
});
