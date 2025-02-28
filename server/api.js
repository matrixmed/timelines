const express = require('express');
const router = express.Router();
const { getDb } = require('./db');

let io;

const setSocketIO = (socketIO) => {
    io = socketIO;
};

router.get('/timelines', async (req, res) => {
    try {
        const db = await getDb();
        const timelines = await db.all('SELECT * FROM timelines ORDER BY dueDate');
        res.json(timelines);
    } catch (error) {
        console.error('Error fetching timelines:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

router.post('/timelines', async (req, res) => {
    const db = await getDb();
    const { market, clientSponsor, project, dueDate, task, complete, team, me, deployment, notes, missedDeadline } = req.body;
    
    try {
        const result = await db.run(`
            INSERT INTO timelines (
                market, clientSponsor, project, dueDate, task,
                complete, team, me, deployment, notes, missedDeadline
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [market, clientSponsor, project, dueDate, task, complete, team, me, deployment, notes, missedDeadline || false]);
        
        const newRow = {
            id: result.lastID,
            ...req.body
        };
        
        res.json(newRow);
        
    } catch (error) {
        console.error('Error creating timeline:', error);
        res.status(500).json({ error: 'Failed to create timeline' });
    }
});

router.put('/timelines/:id', async (req, res) => {
    const db = await getDb();
    const { id } = req.params;
    const { 
        market, clientSponsor, project, dueDate, task, 
        complete, team, me, deployment, notes, missedDeadline 
    } = req.body;
    
    try {
        await db.run(`
            UPDATE timelines 
            SET market = ?, clientSponsor = ?, project = ?, dueDate = ?,
                task = ?, complete = ?, team = ?, me = ?, deployment = ?, 
                notes = ?, missedDeadline = ?
            WHERE id = ?
        `, [market, clientSponsor, project, dueDate, task, complete, 
            team, me, deployment, notes, missedDeadline, id]);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error updating timeline:', error);
        res.status(500).json({ error: 'Failed to update timeline' });
    }
});

router.delete('/timelines/:id', async (req, res) => {
    const db = await getDb();
    const { id } = req.params;
    
    try {
        await db.run('DELETE FROM timelines WHERE id = ?', id);
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error deleting timeline:', error);
        res.status(500).json({ error: 'Failed to delete timeline' });
    }
});

router.get('/timelines/:id', async (req, res) => {
    const db = await getDb();
    const { id } = req.params;
    
    try {
        const timeline = await db.get('SELECT * FROM timelines WHERE id = ?', id);
        if (!timeline) {
            res.status(404).json({ error: 'Timeline not found' });
            return;
        }
        res.json(timeline);
        
    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Failed to fetch timeline' });
    }
});

module.exports = {
    router,
    setSocketIO
};