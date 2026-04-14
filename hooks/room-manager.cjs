const rooms = new Map();
const clientRooms = new Map();

const S4 = () => Math.floor((1 + Math.random()) * 0x10000)
  .toString(16)
  .substring(1);
const generateClientId = () => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;

const ensureRoom = (roomCode) => {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, new Map());
  }
  return rooms.get(roomCode);
};

const addClientToRoom = (roomCode, clientId, connection) => {
  const roomClients = ensureRoom(roomCode);
  roomClients.set(clientId, connection);
  clientRooms.set(clientId, roomCode);
  return roomClients;
};

const getRoomCodeForClient = (clientId) => clientRooms.get(clientId);

const removeClientFromRoom = (clientId) => {
  const roomCode = clientRooms.get(clientId);
  if (!roomCode) {
    clientRooms.delete(clientId);
    return null;
  }

  const roomClients = rooms.get(roomCode);
  if (!roomClients) {
    clientRooms.delete(clientId);
    return null;
  }

  roomClients.delete(clientId);
  if (roomClients.size === 0) {
    rooms.delete(roomCode);
  }

  clientRooms.delete(clientId);
  return { roomCode, roomClients };
};

const broadcastToRoom = (roomCode, payload, excludeId) => {
  const roomClients = rooms.get(roomCode);
  if (!roomClients) return;
  const message = JSON.stringify(payload);
  for (const [otherId, connection] of roomClients.entries()) {
    if (excludeId && otherId === excludeId) continue;
    if (connection && connection.connected) {
      connection.sendUTF(message);
    }
  }
};

module.exports = {
  rooms,
  generateClientId,
  addClientToRoom,
  removeClientFromRoom,
  getRoomCodeForClient,
  broadcastToRoom
};
