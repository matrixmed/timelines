const express = require('express');
const router = express.Router();
const { getDb } = require('./db');
let io;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const formatDateReadable = (dateStr) => {
  try {
    const str = dateStr instanceof Date ? dateStr.toISOString() : String(dateStr);
    const parts = str.split('T')[0].split('-').map(Number);
    if (parts.some(isNaN)) return String(dateStr);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return String(dateStr); }
};

const buildAutoNote = (message) => `[AUTO] ${message}`;

const replaceAutoNotes = (existingNotes, newAutoNote) => {
  const lines = (existingNotes || '').split('\n');
  const userLines = lines.filter(l => !l.startsWith('[AUTO]'));
  const userNotes = userLines.join('\n').trim();
  return userNotes ? `${newAutoNote}\n${userNotes}` : newAutoNote;
};

const transformSocialColumns = (rows) => {
  return rows.map(row => {
    const transformed = {};
    Object.keys(row).forEach(key => {
      if (key === 'postdate') {
        transformed['postDate'] = row[key];
      } else if (key === 'linkedtimelineid') {
        transformed['linkedTimelineId'] = row[key];
      } else if (key === 'linkeddateoffset') {
        transformed['linkedDateOffset'] = row[key];
      } else if (key === 'linkedrowdeleted') {
        transformed['linkedRowDeleted'] = row[key];
      } else if (key === 'linkedtask' || key === 'linkedTask') {
        transformed['linkedTask'] = row[key];
      } else if (key === 'datechanged') {
        transformed['dateChanged'] = row[key];
      } else if (key === 'linkedMissedDeadline' || key === 'linkedmisseddeadline') {
        transformed['linkedMissedDeadline'] = row[key];
      } else if (key === 'createdat') {
        transformed['createdAt'] = row[key];
      } else if (key === 'updatedat') {
        transformed['updatedAt'] = row[key];
      } else {
        transformed[key] = row[key];
      }
    });
    return transformed;
  });
};

async function getLinkedTimelineInfo(db, timelineId) {
  if (!timelineId) return null;
  const result = await db.query(
    'SELECT task, dueDate, missedDeadline FROM timelines WHERE id = $1',
    [timelineId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

router.get('/social', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.query(`
      SELECT s.*, t.task as "linkedTask", t.missedDeadline as "linkedMissedDeadline"
      FROM social_posts s
      LEFT JOIN timelines t ON s.linkedTimelineId = t.id
      ORDER BY s.postDate
    `);
    const transformedRows = transformSocialColumns(result.rows);
    res.json(transformedRows);
  } catch (error) {
    console.error('Error fetching social posts:', error);
    res.status(500).json({ error: 'Failed to fetch social posts' });
  }
});

router.get('/social/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const result = await db.query('SELECT * FROM social_posts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Social post not found' });
    }
    const transformedRow = transformSocialColumns([result.rows[0]])[0];
    res.json(transformedRow);
  } catch (error) {
    console.error('Error fetching social post:', error);
    res.status(500).json({ error: 'Failed to fetch social post' });
  }
});

router.post('/social', async (req, res) => {
  try {
    const db = await getDb();
    const {
      details, brand, content, platforms, postDate, status,
      owner, notes, linkedTimelineId, linkedDateOffset, linkedRowDeleted
    } = req.body;

    let finalNotes = notes;
    if (linkedTimelineId) {
      const info = await getLinkedTimelineInfo(db, linkedTimelineId);
      if (info && info.task) {
        const autoNote = buildAutoNote(`Social post for ${info.task}`);
        finalNotes = replaceAutoNotes(notes, autoNote);
      }
    }

    const result = await db.query(`
      INSERT INTO social_posts (
        details, brand, content, platforms, postDate, status,
        owner, notes, linkedTimelineId, linkedDateOffset, linkedRowDeleted, dateChanged
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      details, brand, content,
      platforms ? (typeof platforms === 'string' ? platforms : JSON.stringify(platforms)) : '[]',
      postDate || null,
      status || 'In Progress',
      owner, finalNotes,
      linkedTimelineId || null,
      linkedDateOffset || 0,
      linkedRowDeleted || false,
      false
    ]);

    const transformedRow = transformSocialColumns([result.rows[0]])[0];

    if (linkedTimelineId) {
      const info = await getLinkedTimelineInfo(db, linkedTimelineId);
      if (info) {
        transformedRow.linkedTask = info.task;
        transformedRow.linkedMissedDeadline = info.misseddeadline || info.missedDeadline;
      }
    }

    res.json(transformedRow);
  } catch (error) {
    console.error('Error creating social post:', error);
    res.status(500).json({ error: 'Failed to create social post' });
  }
});

router.put('/social/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const {
      details, brand, content, platforms, postDate, status,
      owner, notes, linkedTimelineId, linkedDateOffset, linkedRowDeleted, dateChanged
    } = req.body;

    const oldResult = await db.query('SELECT * FROM social_posts WHERE id = $1', [id]);
    const oldRow = oldResult.rows.length > 0 ? oldResult.rows[0] : null;
    const wasLinked = oldRow && oldRow.linkedtimelineid;
    const nowLinked = linkedTimelineId;

    let finalNotes = notes;
    if (!wasLinked && nowLinked) {
      const info = await getLinkedTimelineInfo(db, nowLinked);
      if (info && info.task) {
        const autoNote = buildAutoNote(`Social post for ${info.task}`);
        finalNotes = replaceAutoNotes(notes, autoNote);
      }
    }

    const result = await db.query(`
      UPDATE social_posts
      SET details = $1, brand = $2, content = $3, platforms = $4,
          postDate = $5, status = $6, owner = $7, notes = $8,
          linkedTimelineId = $9, linkedDateOffset = $10, linkedRowDeleted = $11,
          dateChanged = $12
      WHERE id = $13
      RETURNING *
    `, [
      details, brand, content,
      platforms ? (typeof platforms === 'string' ? platforms : JSON.stringify(platforms)) : '[]',
      postDate || null,
      status || 'In Progress',
      owner, finalNotes,
      linkedTimelineId || null,
      linkedDateOffset || 0,
      linkedRowDeleted || false,
      dateChanged || false,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Social post not found' });
    }

    const transformedRow = transformSocialColumns([result.rows[0]])[0];

    if (transformedRow.linkedTimelineId) {
      const info = await getLinkedTimelineInfo(db, transformedRow.linkedTimelineId);
      if (info) {
        transformedRow.linkedTask = info.task;
        transformedRow.linkedMissedDeadline = info.misseddeadline || info.missedDeadline;
      }
    }

    res.json(transformedRow);

    if (io) {
      io.to('timelines').emit('social-update', transformedRow);
    }
  } catch (error) {
    console.error('Error updating social post:', error);
    res.status(500).json({ error: 'Failed to update social post' });
  }
});

router.delete('/social/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    await db.query('DELETE FROM social_posts WHERE id = $1', [id]);
    res.json({ success: true });

    if (io) {
      io.to('timelines').emit('social-delete', id);
    }
  } catch (error) {
    console.error('Error deleting social post:', error);
    res.status(500).json({ error: 'Failed to delete social post' });
  }
});

async function syncLinkedSocialDates(timelineId, newDueDate, socketIO, oldDueDate) {
  try {
    const db = await getDb();
    const linked = await db.query(
      'SELECT * FROM social_posts WHERE linkedTimelineId = $1',
      [timelineId]
    );

    if (linked.rows.length === 0) return;

    const info = await getLinkedTimelineInfo(db, timelineId);
    const taskName = info ? info.task : 'linked task';

    const newDueDateObj = new Date(newDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isFutureDate = newDueDateObj >= today;

    for (const row of linked.rows) {
      const offset = row.linkeddateoffset || 0;
      const newPostDate = new Date(newDueDateObj);
      newPostDate.setDate(newPostDate.getDate() + offset);
      const newPostDateStr = newPostDate.toISOString().split('T')[0];

      let autoNoteText;
      if (oldDueDate) {
        autoNoteText = `Due date changed from ${formatDateReadable(oldDueDate)} to ${formatDateReadable(newPostDateStr)}`;
      } else {
        autoNoteText = `Due date set to ${formatDateReadable(newPostDateStr)}`;
      }
      const autoNote = buildAutoNote(autoNoteText);
      const newNotes = replaceAutoNotes(row.notes, autoNote);

      let newStatus = row.status;
      if (row.status === 'Standby' && isFutureDate) {
        newStatus = 'In Progress';
      }

      const updated = await db.query(
        `UPDATE social_posts
         SET postDate = $1, notes = $2, dateChanged = true, status = $3
         WHERE id = $4 RETURNING *`,
        [newPostDateStr, newNotes, newStatus, row.id]
      );

      if (updated.rows.length > 0 && socketIO) {
        const transformed = transformSocialColumns([updated.rows[0]])[0];
        transformed.linkedTask = taskName;
        transformed.linkedMissedDeadline = info ? (info.misseddeadline || info.missedDeadline || false) : false;
        socketIO.to('timelines').emit('social-update', transformed);
      }
    }
  } catch (error) {
    console.error('Error syncing linked social dates:', error);
  }
}

async function flagLinkedSocialDeleted(timelineId, socketIO) {
  try {
    const db = await getDb();
    const linked = await db.query(
      'SELECT * FROM social_posts WHERE linkedTimelineId = $1',
      [timelineId]
    );

    for (const row of linked.rows) {
      const autoNote = buildAutoNote('Linked editor row was deleted');
      const newNotes = replaceAutoNotes(row.notes, autoNote);

      const updated = await db.query(
        `UPDATE social_posts
         SET linkedRowDeleted = true, linkedTimelineId = NULL, notes = $1
         WHERE id = $2 RETURNING *`,
        [newNotes, row.id]
      );

      if (updated.rows.length > 0 && socketIO) {
        const transformed = transformSocialColumns([updated.rows[0]])[0];
        socketIO.to('timelines').emit('social-update', transformed);
      }
    }
  } catch (error) {
    console.error('Error flagging linked social deleted:', error);
  }
}

async function flagLinkedSocialStandby(timelineId, missedDeadline, socketIO) {
  try {
    const db = await getDb();
    const info = await getLinkedTimelineInfo(db, timelineId);
    const taskName = info ? info.task : 'linked task';

    if (missedDeadline) {
      const linked = await db.query(
        "SELECT * FROM social_posts WHERE linkedTimelineId = $1 AND status != 'Complete'",
        [timelineId]
      );

      for (const row of linked.rows) {
        const autoNote = buildAutoNote(`Editor task "${taskName}" missed deadline - post on standby`);
        const newNotes = replaceAutoNotes(row.notes, autoNote);

        const updated = await db.query(
          `UPDATE social_posts SET status = 'Standby', notes = $1, dateChanged = false
           WHERE id = $2 RETURNING *`,
          [newNotes, row.id]
        );

        if (updated.rows.length > 0 && socketIO) {
          const transformed = transformSocialColumns([updated.rows[0]])[0];
          transformed.linkedTask = taskName;
          transformed.linkedMissedDeadline = true;
          socketIO.to('timelines').emit('social-update', transformed);
        }
      }
    } else {
      const linked = await db.query(
        "SELECT * FROM social_posts WHERE linkedTimelineId = $1 AND status = 'Standby'",
        [timelineId]
      );

      for (const row of linked.rows) {
        const autoNote = buildAutoNote(`Editor task "${taskName}" deadline recovered - back in progress`);
        const newNotes = replaceAutoNotes(row.notes, autoNote);

        const updated = await db.query(
          `UPDATE social_posts SET status = 'In Progress', notes = $1
           WHERE id = $2 RETURNING *`,
          [newNotes, row.id]
        );

        if (updated.rows.length > 0 && socketIO) {
          const transformed = transformSocialColumns([updated.rows[0]])[0];
          transformed.linkedTask = taskName;
          transformed.linkedMissedDeadline = false;
          socketIO.to('timelines').emit('social-update', transformed);
        }
      }
    }
  } catch (error) {
    console.error('Error flagging linked social standby:', error);
  }
}

module.exports = {
  router,
  setSocketIO,
  syncLinkedSocialDates,
  flagLinkedSocialDeleted,
  flagLinkedSocialStandby
};