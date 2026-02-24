const { getDb } = require('./db');

async function initializeSocialDb() {
  try {
    const db = await getDb();

    await db.query(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id SERIAL PRIMARY KEY,
        details TEXT,
        brand TEXT,
        content TEXT,
        platforms TEXT,
        postDate DATE,
        status TEXT DEFAULT 'In Progress',
        owner TEXT,
        notes TEXT,
        linkedTimelineId INTEGER REFERENCES timelines(id) ON DELETE SET NULL,
        linkedDateOffset INTEGER DEFAULT 0,
        linkedRowDeleted BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const triggerExists = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_social_timestamp'
      );
    `);

    if (!triggerExists.rows[0].exists) {
      await db.query(`
        CREATE TRIGGER update_social_timestamp
        BEFORE UPDATE ON social_posts
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
      `);
    }

    console.log('Social database initialized successfully');
  } catch (error) {
    console.error('Error initializing social database:', error);
    throw error;
  }
}

module.exports = { initializeSocialDb };
