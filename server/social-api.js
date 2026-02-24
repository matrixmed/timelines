const express = require('express');
const router = express.Router();
const { getDb } = require('./db');
let io;

const setSocketIO = (socketIO) => {
  io = socketIO;
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

router.get('/social', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.query('SELECT * FROM social_posts ORDER BY postDate');
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

    const result = await db.query(`
      INSERT INTO social_posts (
        details, brand, content, platforms, postDate, status,
        owner, notes, linkedTimelineId, linkedDateOffset, linkedRowDeleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      details, brand, content,
      platforms ? (typeof platforms === 'string' ? platforms : JSON.stringify(platforms)) : '[]',
      postDate || null,
      status || 'In Progress',
      owner, notes,
      linkedTimelineId || null,
      linkedDateOffset || 0,
      linkedRowDeleted || false
    ]);

    const transformedRow = transformSocialColumns([result.rows[0]])[0];
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
      owner, notes, linkedTimelineId, linkedDateOffset, linkedRowDeleted
    } = req.body;

    const result = await db.query(`
      UPDATE social_posts
      SET details = $1, brand = $2, content = $3, platforms = $4,
          postDate = $5, status = $6, owner = $7, notes = $8,
          linkedTimelineId = $9, linkedDateOffset = $10, linkedRowDeleted = $11
      WHERE id = $12
      RETURNING *
    `, [
      details, brand, content,
      platforms ? (typeof platforms === 'string' ? platforms : JSON.stringify(platforms)) : '[]',
      postDate || null,
      status || 'In Progress',
      owner, notes,
      linkedTimelineId || null,
      linkedDateOffset || 0,
      linkedRowDeleted || false,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Social post not found' });
    }

    const transformedRow = transformSocialColumns([result.rows[0]])[0];
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

async function syncLinkedSocialDates(timelineId, newDueDate, socketIO) {
  try {
    const db = await getDb();
    const linked = await db.query(
      'SELECT * FROM social_posts WHERE linkedTimelineId = $1',
      [timelineId]
    );

    if (linked.rows.length === 0) return;

    const newDueDateObj = new Date(newDueDate);

    for (const row of linked.rows) {
      const offset = row.linkeddateoffset || 0;
      const newPostDate = new Date(newDueDateObj);
      newPostDate.setDate(newPostDate.getDate() + offset);
      const newPostDateStr = newPostDate.toISOString().split('T')[0];

      const updated = await db.query(
        'UPDATE social_posts SET postDate = $1 WHERE id = $2 RETURNING *',
        [newPostDateStr, row.id]
      );

      if (updated.rows.length > 0 && socketIO) {
        const transformed = transformSocialColumns([updated.rows[0]])[0];
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
      const updated = await db.query(
        'UPDATE social_posts SET linkedRowDeleted = true, linkedTimelineId = NULL WHERE id = $1 RETURNING *',
        [row.id]
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
    if (!missedDeadline) return;

    const db = await getDb();
    const linked = await db.query(
      "SELECT * FROM social_posts WHERE linkedTimelineId = $1 AND status != 'Complete'",
      [timelineId]
    );

    for (const row of linked.rows) {
      const updated = await db.query(
        "UPDATE social_posts SET status = 'Standby' WHERE id = $1 RETURNING *",
        [row.id]
      );

      if (updated.rows.length > 0 && socketIO) {
        const transformed = transformSocialColumns([updated.rows[0]])[0];
        socketIO.to('timelines').emit('social-update', transformed);
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
