const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const Papa = require('papaparse');
const fs = require('fs');

async function getDb() {
    return open({
        filename: path.join(__dirname, 'timelines.db'),
        driver: sqlite3.Database
    });
}

async function initializeDb() {
    const db = await getDb();
    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS timelines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            market TEXT,
            clientSponsor TEXT,
            project TEXT,
            dueDate DATE,
            task TEXT,
            complete BOOLEAN DEFAULT 0,
            team TEXT,
            me TEXT,
            deployment TEXT,
            notes TEXT,
            missedDeadline BOOLEAN DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    await db.exec(`
        PRAGMA table_info(timelines);
    `).then(async (columns) => {
        if (!columns.some(col => col.name === 'missedDeadline')) {
            await db.exec(`
                ALTER TABLE timelines 
                ADD COLUMN missedDeadline BOOLEAN DEFAULT 0;
            `);
        }
    });

    await db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_timestamp 
        AFTER UPDATE ON timelines
        BEGIN
            UPDATE timelines SET updatedAt = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
        END;
    `);

    return db;
}

async function importCsv(filepath) {
    const db = await getDb();
    
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const { data } = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
            return header
                .replace('Client/Sponsor', 'clientSponsor')
                .replace('Due Date', 'dueDate')
                .replace('ME', 'me')
                .replace(/\s+/g, '')
                .replace(/^./, str => str.toLowerCase());
        }
    });
    
    const stmt = await db.prepare(`
        INSERT INTO timelines (
            market, clientSponsor, project, dueDate, task,
            complete, team, me, deployment, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const row of data) {
        await stmt.run([
            row.market,
            row.clientSponsor,
            row.project,
            row.dueDate,
            row.task,
            row.complete === 'TRUE' ? 1 : 0,
            row.team,
            row.me,
            row.deployment || '',
            row.notes || ''
        ]);
    }
    
    await stmt.finalize();
    console.log(`Imported ${data.length} records`);
}

module.exports = {
    getDb,
    initializeDb,
    importCsv
};