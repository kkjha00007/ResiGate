// Backend WebSocket server for real-time notifications
// Run this server alongside your Next.js app

const { WebSocketServer } = require('ws');
const http = require('http');

const PORT = process.env.NOTIF_WS_PORT || 4001;

// Store connected clients
const clients = new Set();

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

// Broadcast function for notification events
function broadcastNotification(notification) {
  const data = JSON.stringify({ type: 'notification', notification });
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}

// Export for use in notification logic
module.exports = {
  server,
  broadcastNotification,
  PORT,
};

// If run directly, start the server
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Notification WebSocket server running on ws://localhost:${PORT}`);
  });
}
