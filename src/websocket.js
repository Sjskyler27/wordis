const listeners = new Map();
const pendingMessages = [];
const statusListeners = new Set();
let currentStatus = 'connecting';

  const isElectron = navigator.userAgent.toLowerCase().includes('electron');
  console.log(`electron app: ${isElectron}`)


const socketUrl = (import.meta.env.VITE_WEBSOCKET_URL && import.meta.env.VITE_MODE !== "dev") || isElectron
      ? `${import.meta.env.VITE_WEBSOCKET_URL}`
      : `ws://localhost:5500`;
const socket = new WebSocket(socketUrl);
console.log(`using socket: ${socketUrl}`)

const flushQueue = () => {
  while (pendingMessages.length && socket.readyState === WebSocket.OPEN) {
    socket.send(pendingMessages.shift());
  }
};

const emit = (type, data = null) => {
  const payload = JSON.stringify({ type, data });
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(payload);
    return;
  }
  pendingMessages.push(payload);
};

const on = (type, handler) => {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  listeners.get(type).add(handler);
};

const updateStatus = (status) => {
  if (currentStatus === status) return;
  currentStatus = status;
  statusListeners.forEach((handler) => handler(status));
};

socket.addEventListener('open', () => {
  flushQueue();
  updateStatus('connected');
});
socket.addEventListener('message', (event) => {
  let payload;
  try {
    payload = JSON.parse(event.data);
  } catch (error) {
    console.error('Unable to parse server message', error);
    return;
  }

  const handlers = listeners.get(payload.type);
  if (!handlers) return;

  handlers.forEach((handler) => handler(payload.data));
});

socket.addEventListener('close', () => updateStatus('disconnected'));
socket.addEventListener('error', () => updateStatus('error'));

const onStatusChange = (handler) => {
  handler(currentStatus);
  statusListeners.add(handler);
  return () => statusListeners.delete(handler);
};

export default { emit, on, onStatusChange };
