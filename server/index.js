const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { initializeDb, importCsv } = require('./db');
const { router: api, setSocketIO } = require('./api');
const { router: socialApi, setSocketIO: setSocialSocketIO } = require('./social-api');
const { initializeSocialDb } = require('./social-db');
const path = require('path');
const cors = require('cors');
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
setSocketIO(io);
setSocialSocketIO(io);

app.use(cors());
app.use(express.json());

app.use('/api', api);
app.use('/api', socialApi);

app.use(express.static(path.resolve(__dirname, '../build')));

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Timeline API Server Running' });
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });
  socket.on('update-timeline', (data) => {
    socket.broadcast.to('timelines').emit('timeline-update', data);
  });
  socket.on('delete-timeline', (id) => {
    socket.broadcast.to('timelines').emit('timeline-delete', id);
  });
  socket.on('create-timeline', (data) => {
    socket.broadcast.to('timelines').emit('timeline-create', data);
  });
  socket.on('update-social', (data) => {
    socket.broadcast.to('timelines').emit('social-update', data);
  });
  socket.on('delete-social', (id) => {
    socket.broadcast.to('timelines').emit('social-delete', id);
  });
  socket.on('create-social', (data) => {
    socket.broadcast.to('timelines').emit('social-create', data);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    socket.leave('timelines');
  });
});

async function startup() {
  try {
    await initializeDb();
    await initializeSocialDb();
    const csvPath = path.join(__dirname, './Timelines.csv');
    if (require('fs').existsSync(csvPath)) {
      await importCsv(csvPath);
    } else {
      console.log('CSV file not found, skipping import');
    }
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

startup();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});