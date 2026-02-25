const express = require('express');
const router = express.Router();
const { getDb } = require('./db');
const { syncLinkedSocialDates, flagLinkedSocialDeleted, flagLinkedSocialStandby } = require('./social-api');
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
  const { market, clientSponsor, project, dueDate, task, complete, team, me, bd, deployment,
          notes, missedDeadline } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO timelines (
        market, clientSponsor, project, dueDate, task,
        complete, team, me, bd, deployment, notes, missedDeadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [market, clientSponsor, project, dueDate, task, complete, team, me, bd, deployment,
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
    complete, team, me, bd, deployment, notes, missedDeadline
  } = req.body;
  try {
    const oldResult = await db.query('SELECT * FROM timelines WHERE id = $1', [id]);
    const oldRow = oldResult.rows.length > 0 ? oldResult.rows[0] : null;

    const result = await db.query(`
      UPDATE timelines
      SET market = $1, clientSponsor = $2, project = $3, dueDate = $4,
          task = $5, complete = $6, team = $7, me = $8, bd = $9, deployment = $10,
          notes = $11, missedDeadline = $12
      WHERE id = $13
      RETURNING *
    `, [market, clientSponsor, project, dueDate, task, complete,
        team, me, bd, deployment, notes, missedDeadline, id]);
    const transformedRow = result.rows.length > 0
      ? transformColumnNames([result.rows[0]])[0]
      : { success: true };
    res.json(transformedRow);
    if (io) {
      io.to('timelines').emit('timeline-update', transformedRow);
    }

    const normDate = (d) => {
      if (!d) return null;
      if (d instanceof Date) return d.toISOString().split('T')[0];
      return String(d).split('T')[0];
    };
    if (oldRow && dueDate && normDate(oldRow.duedate) !== normDate(dueDate)) {
      syncLinkedSocialDates(id, dueDate, io, oldRow.duedate);
    }

    if (oldRow && missedDeadline && !oldRow.misseddeadline) {
      flagLinkedSocialStandby(id, true, io);
    } else if (oldRow && !missedDeadline && oldRow.misseddeadline) {
      flagLinkedSocialStandby(id, false, io);
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
    await flagLinkedSocialDeleted(id, io);

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