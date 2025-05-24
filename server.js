const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// File paths
const TASKS_FILE = path.join(__dirname, 'data', 'tasks', 'tasks.yaml');
const TODAYS_TASKS_FILE = path.join(__dirname, 'data', 'state', 'todays_tasks.json');
const COMPLETED_TASKS_FILE = path.join(__dirname, 'data', 'state', 'completed_tasks.json');

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper function to get available tasks (not completed in last 7 days)
function getAvailableTasks() {
    try {
        const allTasks = yaml.load(fs.readFileSync(TASKS_FILE, 'utf8'));
        const completedTasks = JSON.parse(fs.readFileSync(COMPLETED_TASKS_FILE, 'utf8')) || [];
        
        // Filter out tasks completed in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentlyCompletedTaskIds = completedTasks
            .filter(task => new Date(task.completedAt) > sevenDaysAgo)
            .map(task => task.id);
        
        const availableTasks = allTasks.filter(task => !recentlyCompletedTaskIds.includes(task.id));
        return availableTasks;
    } catch (error) {
        console.error('Error in getAvailableTasks:', error);
        return [];
    }
}

// Helper function to save completed task
function saveCompletedTask(task) {
    const completedTasks = JSON.parse(fs.readFileSync(COMPLETED_TASKS_FILE, 'utf8')) || [];
    completedTasks.push({
        id: task.id,
        completedAt: new Date().toISOString()
    });
    fs.writeFileSync(COMPLETED_TASKS_FILE, JSON.stringify(completedTasks, null, 2));
}

// API Routes
// Get all tasks
app.get('/tasks', (req, res) => {
    try {
        const fileContents = fs.readFileSync(TASKS_FILE, 'utf8');
        const tasks = yaml.load(fileContents) || [];
        res.json(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        res.json([]);
    }
});

// Get completed tasks
app.get('/tasks/completed', (req, res) => {
    try {
        const completedTasks = JSON.parse(fs.readFileSync(COMPLETED_TASKS_FILE, 'utf8')) || [];
        res.json(completedTasks);
    } catch (error) {
        console.error('Error loading completed tasks:', error);
        res.json([]);
    }
});

// Get today's tasks
app.get('/tasks/today', (req, res) => {
    try {
        let todaysTasks = [];
        try {
            const fileContents = fs.readFileSync(TODAYS_TASKS_FILE, 'utf8');
            todaysTasks = JSON.parse(fileContents) || [];
        } catch (error) {
            console.error('Error reading today\'s tasks file:', error);
            todaysTasks = [];
        }

        // If today's tasks file doesn't exist or is empty, shuffle new tasks
        if (!todaysTasks || todaysTasks.length === 0) {
            const availableTasks = getAvailableTasks();
            // Select up to 8 random tasks
            const selectedTasks = shuffleArray([...availableTasks]).slice(0, 8);
            // Use existing task IDs
            todaysTasks = selectedTasks;
            // Save to file
            fs.writeFileSync(TODAYS_TASKS_FILE, JSON.stringify(todaysTasks, null, 2));
        }
        res.json(todaysTasks);
    } catch (error) {
        console.error('Error in /tasks/today endpoint:', error);
        res.json([]);
    }
});

// Force shuffle new tasks for today
app.post('/tasks/today/shuffle', (req, res) => {
    try {
        const availableTasks = getAvailableTasks();
        // Select up to 8 random tasks
        const selectedTasks = shuffleArray([...availableTasks]).slice(0, 8);
        // Use existing task IDs
        const todaysTasks = selectedTasks;
        // Save to file
        fs.writeFileSync(TODAYS_TASKS_FILE, JSON.stringify(todaysTasks, null, 2));
        res.json(todaysTasks);
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Mark a task as complete
app.post('/tasks/today/:taskId/complete', (req, res) => {
    try {
        const taskId = req.params.taskId;
        const fileContents = fs.readFileSync(TODAYS_TASKS_FILE, 'utf8');
        const todaysTasks = JSON.parse(fileContents);
        
        // Find the task
        const task = todaysTasks.find(t => t.id === taskId);
        if (task) {
            // Save to completed tasks
            saveCompletedTask(task);
            res.json({ success: true });
        } else {
            res.json({ error: 'Task not found' });
        }
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Save tasks
app.post('/tasks', (req, res) => {
    try {
        const tasks = req.body;
        const yamlStr = yaml.dump(tasks);
        fs.writeFileSync(TASKS_FILE, yamlStr, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Static file serving (after API routes)
app.use('/', express.static('site'));
app.use('/data', express.static('data'));

// Handle component paths
app.get('/site/*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 