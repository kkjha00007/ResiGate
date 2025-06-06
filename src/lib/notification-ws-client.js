// Utility to send notification events to the WebSocket server
const WebSocket = require('ws');

const WS_PORT = process.env.NOTIF_WS_PORT || 4001;
const WS_URL = `ws://localhost:${WS_PORT}`;

function sendNotificationEvent(notification) {
  // Open a short-lived WebSocket connection to broadcast the event
  const ws = new WebSocket(WS_URL);
  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'notification', notification }));
    ws.close();
  });
}

module.exports = { sendNotificationEvent };
