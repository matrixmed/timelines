const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { initializeDb, importCsv } = require('./db');
const { router: api, setSocketIO } = require('./api');
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

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', api);

// Serve static files from the React app build folder
app.use(express.static(path.resolve(__dirname, '../build')));

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'Timeline API Server Running' });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});

// Socket.io setup
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

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        socket.leave('timelines');
    });
});

async function startup() {
    try {
        await initializeDb();
        await importCsv(path.join(__dirname, './Timelines.csv'));
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