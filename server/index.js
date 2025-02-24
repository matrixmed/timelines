const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { initializeDb, importCsv } = require('./db');
const { router: api, setSocketIO } = require('./api');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

setSocketIO(io);

app.use(express.json());
app.use('/api', api);

app.get('/', (req, res) => {
    res.json({ message: 'Timeline API Server Running' });
});

io.on('connection', (socket) => {
    socket.on('join', (room) => {
        socket.join(room);
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

    socket.on('disconnect', () => {
        socket.leave('timelines');
    });
});

async function startup() {
    try {
        await initializeDb();
        await importCsv('./Timelines.csv');
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