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
    const result = await db.query('SELECT * FROM timelines ORDER BY dueDate');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching timelines:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/timelines', async (req, res) => {
  const db = await getDb();
  const { market, clientSponsor, project, dueDate, task, complete, team, me, deployment,
    notes, missedDeadline } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO timelines (
        market, clientSponsor, project, dueDate, task,
        complete, team, me, deployment, notes, missedDeadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [market, clientSponsor, project, dueDate, task, complete, team, me, deployment,
      notes, missedDeadline || false]);
    
    const newRow = result.rows[0];
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
    await db.query(`
      UPDATE timelines
      SET market = $1, clientSponsor = $2, project = $3, dueDate = $4,
          task = $5, complete = $6, team = $7, me = $8, deployment = $9,
          notes = $10, missedDeadline = $11
      WHERE id = $12
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
    await db.query('DELETE FROM timelines WHERE id = $1', [id]);
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
    const result = await db.query('SELECT * FROM timelines WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Timeline not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

module.exports = {
  router,
  setSocketIO
};