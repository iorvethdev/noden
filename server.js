const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Chat log stored in memory
let chatLog = [];

// WebSocket connection handler
wss.on('connection', (ws) => {
  // Send existing chat history to new client
  ws.send(JSON.stringify({ type: 'history', data: chatLog }));
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      
      // Backdoor: clear chat with special command
      if (msg.type === 'command' && msg.command === 'clear') {
        chatLog = [];
        // Notify all clients that chat was cleared
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'cleared' }));
          }
        });
        return;
      }
      
      if (msg.type === 'message' && msg.user && msg.text) {
        const chatMsg = { user: msg.user, text: msg.text, timestamp: new Date().toISOString() };
        chatLog.push(chatMsg);
        
        // Broadcast to all connected clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', data: chatMsg }));
          }
        });
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`HyperTalk running on port ${PORT}`);
});
