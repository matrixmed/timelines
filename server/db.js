const { Pool } = require('pg');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getDb() {
  return pool;
}

async function initializeDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS timelines (
        id SERIAL PRIMARY KEY,
        market TEXT,
        clientSponsor TEXT,
        project TEXT,
        dueDate DATE,
        task TEXT,
        complete BOOLEAN DEFAULT FALSE,
        team TEXT,
        me TEXT,
        deployment TEXT,
        notes TEXT,
        missedDeadline BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updatedAt = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    const triggerExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_timestamp'
      );
    `);
    
    if (!triggerExists.rows[0].exists) {
      await pool.query(`
        CREATE TRIGGER update_timestamp
        BEFORE UPDATE ON timelines
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
      `);
    }
    
    console.log('Database initialized successfully');
    return pool;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function importCsv(filepath) {
  try {
    const existingCount = await pool.query('SELECT COUNT(*) as count FROM timelines');
    
    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`Database already contains ${existingCount.rows[0].count} records. Skipping import.`);
      return;
    }
    
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        return header
          .replace('Client/Sponsor', 'clientSponsor')
          .replace('Due Date', 'dueDate')
          .replace('ME', 'me')
          .replace('Missed Deadline', 'missedDeadline')
          .replace(/\s+/g, '')
          .replace(/^./, str => str.toLowerCase());
      }
    });
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const row of data) {
        await client.query(`
          INSERT INTO timelines (
            market, clientSponsor, project, dueDate, task,
            complete, team, me, deployment, notes, missedDeadline
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          row.market || '',
          row.clientSponsor || '',
          row.project || '',
          row.dueDate ? new Date(row.dueDate) : null,
          row.task || '',
          row.complete === 'TRUE' || row.complete === true,
          row.team || '',
          row.me || '',
          row.deployment || '',
          row.notes || '',
          row.missedDeadline === 'TRUE' || row.missedDeadline === true
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`Imported ${data.length} records successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error during import, transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error importing CSV:', error);
    throw error;
  }
}

module.exports = {
  getDb,
  initializeDb,
  importCsv
};