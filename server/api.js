const express = require('express');
const router = express.Router();
const { getDb } = require('./db');
let io;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const transformColumnNames = (rows) => {
  return rows.map(row => {
    const transformed = {};
    Object.keys(row).forEach(key => {
      if (key === 'duedate') {
        transformed['dueDate'] = row[key];
      } else if (key === 'clientsponsor') {
        transformed['clientSponsor'] = row[key];
      } else if (key === 'misseddeadline') {
        transformed['missedDeadline'] = row[key];
      } else {
        transformed[key] = row[key];
      }
    });
    return transformed;
  });
};

router.get('/timelines', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.query('SELECT * FROM timelines ORDER BY dueDate');
    
    const transformedRows = transformColumnNames(result.rows);
    
    res.json(transformedRows);
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
    
    const transformedRow = transformColumnNames([result.rows[0]])[0];
    
    res.json(transformedRow);
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
    const result = await db.query(`
      UPDATE timelines
      SET market = $1, clientSponsor = $2, project = $3, dueDate = $4,
        task = $5, complete = $6, team = $7, me = $8, deployment = $9,
        notes = $10, missedDeadline = $11
      WHERE id = $12
      RETURNING *
    `, [market, clientSponsor, project, dueDate, task, complete,
      team, me, deployment, notes, missedDeadline, id]);
    
    const transformedRow = result.rows.length > 0 
      ? transformColumnNames([result.rows[0]])[0] 
      : { success: true };
    
    res.json(transformedRow);
    
    if (io) {
      io.to('timelines').emit('timeline-update', transformedRow);
    }
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
    
    if (io) {
      io.to('timelines').emit('timeline-delete', id);
    }
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
    
    const transformedRow = transformColumnNames([result.rows[0]])[0];
    
    res.json(transformedRow);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

module.exports = {
  router,
  setSocketIO
};