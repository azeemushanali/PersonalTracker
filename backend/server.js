const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'actionflow.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Initialize database tables
function initDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL
        )`);

        // Resource actions table
        db.run(`CREATE TABLE IF NOT EXISTS resource_actions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            section TEXT NOT NULL,
            dueDate TEXT NOT NULL,
            status TEXT NOT NULL,
            assignee TEXT NOT NULL,
            completedAt TEXT,
            createdAt TEXT NOT NULL,
            userId TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`);

        // Activity actions table
        db.run(`CREATE TABLE IF NOT EXISTS activity_actions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            section TEXT NOT NULL,
            dueDate TEXT NOT NULL,
            status TEXT NOT NULL,
            completedAt TEXT,
            createdAt TEXT NOT NULL,
            userId TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`);

        // Seed demo user
        db.get('SELECT * FROM users WHERE email = ?', ['demo@actionflow.com'], (err, row) => {
            if (!row) {
                db.run(
                    'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
                    ['user1', 'demo@actionflow.com', 'demo123', 'Demo User']
                );
                console.log('Demo user created');
                seedInitialData();
            }
        });
    });
}

// Seed initial data
function seedInitialData() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const resourceActions = [
        { id: '1', title: 'Review data pipeline architecture', section: 'DAP', dueDate: today, status: 'Pending', assignee: 'Rohit Hota', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: '2', title: 'Optimize ETL workflows', section: 'DAP', dueDate: today, status: 'Pending', assignee: 'Bittu', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: '3', title: 'Train ML model for predictions', section: 'AI/ML', dueDate: today, status: 'Pending', assignee: 'Aditya', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: '4', title: 'Interview senior engineer', section: 'Hiring', dueDate: tomorrow, status: 'Pending', assignee: 'Asif', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: '5', title: 'Prepare Q1 sales strategy', section: 'GTM', dueDate: today, status: 'Completed', assignee: 'Gokul', completedAt: new Date().toISOString(), createdAt: new Date().toISOString(), userId: 'user1' },
        { id: '6', title: 'Review candidate profiles', section: 'Hiring', dueDate: yesterday, status: 'Pending', assignee: 'Rohit Hota', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: '7', title: 'Deploy microservices to production', section: 'Delivery', dueDate: tomorrow, status: 'Pending', assignee: 'Bittu', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' }
    ];

    const activityActions = [
        { id: 'a1', title: 'Set up CI/CD pipeline', description: '', section: 'DAP', dueDate: today, status: 'Pending', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: 'a2', title: 'Deploy new features', description: '', section: 'DAP', dueDate: tomorrow, status: 'Pending', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: 'a3', title: 'Fine-tune recommendation algorithm', description: '', section: 'AI/ML', dueDate: today, status: 'Completed', completedAt: new Date().toISOString(), createdAt: new Date().toISOString(), userId: 'user1' },
        { id: 'a4', title: 'Schedule interviews for next week', description: '', section: 'Hiring', dueDate: tomorrow, status: 'Pending', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' },
        { id: 'a5', title: 'Launch marketing campaign', description: '', section: 'GTM', dueDate: today, status: 'Pending', completedAt: null, createdAt: new Date().toISOString(), userId: 'user1' }
    ];

    resourceActions.forEach(action => {
        db.run(
            'INSERT INTO resource_actions (id, title, section, dueDate, status, assignee, completedAt, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [action.id, action.title, action.section, action.dueDate, action.status, action.assignee, action.completedAt, action.createdAt, action.userId]
        );
    });

    activityActions.forEach(action => {
        db.run(
            'INSERT INTO activity_actions (id, title, description, section, dueDate, status, completedAt, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [action.id, action.title, action.description || '', action.section, action.dueDate, action.status, action.completedAt, action.createdAt, action.userId]
        );
    });

    console.log('Initial data seeded');
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return res.json({ success: true, user: userWithoutPassword });
        }
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    });
});

app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    const userId = `user${Date.now()}`;
    
    db.run(
        'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
        [userId, email, password, name],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ success: false, error: 'User already exists' });
                }
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            res.json({ success: true, user: { id: userId, email, name } });
        }
    );
});

// ==================== RESOURCE ACTIONS ROUTES ====================
app.get('/api/resource-actions/:userId', (req, res) => {
    db.all('SELECT * FROM resource_actions WHERE userId = ?', [req.params.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/resource-actions', (req, res) => {
    const { title, section, dueDate, assignee, userId } = req.body;
    const id = `r${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    db.run(
        'INSERT INTO resource_actions (id, title, section, dueDate, status, assignee, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, title, section, dueDate, 'Pending', assignee, createdAt, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ id, title, section, dueDate, status: 'Pending', assignee, completedAt: null, createdAt, userId });
        }
    );
});

app.put('/api/resource-actions/:id', (req, res) => {
    const { title, description, section, dueDate, assignee, status, completedAt } = req.body;
    console.log('UPDATE resource action:', req.params.id, req.body);
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (section !== undefined) {
        updates.push('section = ?');
        values.push(section);
    }
    if (dueDate !== undefined) {
        updates.push('dueDate = ?');
        values.push(dueDate);
    }
    if (assignee !== undefined) {
        updates.push('assignee = ?');
        values.push(assignee);
    }
    if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
    }
    if (completedAt !== undefined) {
        updates.push('completedAt = ?');
        values.push(completedAt);
    }
    
    values.push(req.params.id);
    
    db.run(
        `UPDATE resource_actions SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
            if (err) {
                console.error('DB error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Rows updated:', this.changes);
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Resource action not found' });
            }
            db.get('SELECT * FROM resource_actions WHERE id = ?', [req.params.id], (err, row) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                console.log('Updated row:', row);
                res.json(row);
            });
        }
    );
});

app.delete('/api/resource-actions/:id', (req, res) => {
    console.log('DELETE resource action:', req.params.id);
    db.run('DELETE FROM resource_actions WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Rows deleted:', this.changes);
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Resource action not found' });
        }
        res.json({ success: true });
    });
});

// ==================== ACTIVITY ACTIONS ROUTES ====================
app.get('/api/activity-actions/:userId', (req, res) => {
    db.all('SELECT * FROM activity_actions WHERE userId = ?', [req.params.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/activity-actions', (req, res) => {
    const { title, description, section, dueDate, userId } = req.body;
    const id = `a${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    db.run(
        'INSERT INTO activity_actions (id, title, description, section, dueDate, status, createdAt, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, title, description || '', section, dueDate, 'Pending', createdAt, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ id, title, description, section, dueDate, status: 'Pending', completedAt: null, createdAt, userId });
        }
    );
});

app.put('/api/activity-actions/:id', (req, res) => {
    const { title, description, section, dueDate, status, completedAt } = req.body;
    console.log('UPDATE activity action:', req.params.id, req.body);
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (section !== undefined) {
        updates.push('section = ?');
        values.push(section);
    }
    if (dueDate !== undefined) {
        updates.push('dueDate = ?');
        values.push(dueDate);
    }
    if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
    }
    if (completedAt !== undefined) {
        updates.push('completedAt = ?');
        values.push(completedAt);
    }
    
    values.push(req.params.id);
    
    db.run(
        `UPDATE activity_actions SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
            if (err) {
                console.error('DB error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Rows updated:', this.changes);
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Activity action not found' });
            }
            db.get('SELECT * FROM activity_actions WHERE id = ?', [req.params.id], (err, row) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                console.log('Updated row:', row);
                res.json(row);
            });
        }
    );
});

app.delete('/api/activity-actions/:id', (req, res) => {
    console.log('DELETE activity action:', req.params.id);
    db.run('DELETE FROM activity_actions WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Rows deleted:', this.changes);
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Activity action not found' });
        }
        res.json({ success: true });
    });
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
