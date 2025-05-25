const express = require('express');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_DAILY_TASKS = 8;

// Middleware to parse JSON bodies
app.use(express.json());

// File paths
const TASKS_FILE = path.join(__dirname, 'data', 'tasks', 'basic_object_oriented_programming_oop.yaml');
const TODAYS_TASKS_FILE = path.join(__dirname, 'data', 'state', 'todays_tasks.json');
const LAST_COMPLETED_FILE = path.join(__dirname, 'data', 'state', 'last_completed.json');
const CURRENT_DAY_FILE = path.join(__dirname, 'data', 'state', 'current_day.json');

// Helper function to get current day string (YYYY-MM-DD)
function getCurrentDayString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Helper function to check if we need to refresh tasks
function shouldRefreshTasks() {
    try {
        let currentDay = '';
        try {
            const fileContents = fs.readFileSync(CURRENT_DAY_FILE, 'utf8');
            currentDay = JSON.parse(fileContents).currentDay;
        } catch (error) {
            currentDay = '';
        }

        const today = getCurrentDayString();
        return currentDay !== today;
    } catch (error) {
        console.error('Error checking if should refresh tasks:', error);
        return true;
    }
}

// Helper function to update current day
function updateCurrentDay() {
    try {
        const today = getCurrentDayString();
        fs.writeFileSync(CURRENT_DAY_FILE, JSON.stringify({ currentDay: today }, null, 2));
    } catch (error) {
        console.error('Error updating current day:', error);
    }
}

// Helper function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper function to get all tasks from all YAML files in data/tasks/
function getAllTasks() {
    const tasksDir = path.join(__dirname, 'data', 'tasks');
    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.yaml'));
    let allTasks = [];
    for (const file of files) {
        const fileContents = fs.readFileSync(path.join(tasksDir, file), 'utf8');
        const yamlData = yaml.load(fileContents);
        if (yamlData.tasks && Array.isArray(yamlData.tasks)) {
            allTasks = allTasks.concat(yamlData.tasks);
        }
    }
    return allTasks;
}

// Helper function to get available tasks (not completed in last 7 days)
function getAvailableTasks() {
    try {
        const allTasks = getAllTasks();
        const lastCompleted = JSON.parse(fs.readFileSync(LAST_COMPLETED_FILE, 'utf8')) || [];
        
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get date 7 days ago at midnight
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Filter out tasks completed between 7 days ago and yesterday
        const recentlyCompletedTaskIds = lastCompleted
            .filter(task => {
                const completedDate = new Date(task.lastCompleted);
                return completedDate >= sevenDaysAgo && completedDate < today;
            })
            .map(task => task.id);
        
        const availableTasks = allTasks.filter(task => !recentlyCompletedTaskIds.includes(task.id));
        return availableTasks;
    } catch (error) {
        console.error('Error in getAvailableTasks:', error);
        return [];
    }
}

// Helper function to update last completed time for a task
function updateLastCompleted(taskId) {
    try {
        let lastCompleted = [];
        try {
            lastCompleted = JSON.parse(fs.readFileSync(LAST_COMPLETED_FILE, 'utf8')) || [];
        } catch (error) {
            lastCompleted = [];
        }

        // Find if task already exists in lastCompleted
        const existingTaskIndex = lastCompleted.findIndex(t => t.id === taskId);
        if (existingTaskIndex !== -1) {
            // Update existing task's lastCompleted time
            lastCompleted[existingTaskIndex].lastCompleted = new Date().toISOString();
        } else {
            // Add new task with lastCompleted time
            lastCompleted.push({
                id: taskId,
                lastCompleted: new Date().toISOString()
            });
        }

        fs.writeFileSync(LAST_COMPLETED_FILE, JSON.stringify(lastCompleted, null, 2));
    } catch (error) {
        console.error('Error updating last completed:', error);
    }
}

// Helper function to refresh today's tasks
function refreshTodaysTasks() {
    const availableTasks = getAvailableTasks();
    const selectedTasks = shuffleArray([...availableTasks]).slice(0, MAX_DAILY_TASKS);
    // Store task IDs with completion status
    const todaysTasks = selectedTasks.map(task => ({
        id: task.id,
        completed: false
    }));
    fs.writeFileSync(TODAYS_TASKS_FILE, JSON.stringify(todaysTasks, null, 2));
    updateCurrentDay();
    return selectedTasks;
}

// API Routes
// Get all tasks
app.get('/tasks', (req, res) => {
    try {
        const allTasks = getAllTasks();
        res.json(allTasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        res.json([]);
    }
});

// Get completed tasks
app.get('/tasks/completed', (req, res) => {
    try {
        const lastCompleted = JSON.parse(fs.readFileSync(LAST_COMPLETED_FILE, 'utf8')) || [];
        res.json(lastCompleted);
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
            todaysTasks = [];
        }

        // If today's tasks file doesn't exist or is empty, or if it's a new day, refresh tasks
        if (!todaysTasks || todaysTasks.length === 0 || shouldRefreshTasks()) {
            const newTasks = refreshTodaysTasks();
            todaysTasks = newTasks.map(task => ({
                id: task.id,
                completed: false
            }));
        }

        // Get full task details and add completion status
        const allTasks = getAllTasks();
        const todaysTasksWithDetails = todaysTasks.map(taskInfo => {
            const task = allTasks.find(t => t.id === taskInfo.id);
            if (task) {
                return {
                    ...task,
                    completed: taskInfo.completed
                };
            }
            return null;
        }).filter(Boolean);

        res.json(todaysTasksWithDetails);
    } catch (error) {
        res.json([]);
    }
});

// Force shuffle new tasks for today
app.post('/tasks/today/shuffle', (req, res) => {
    try {
        const selectedTasks = refreshTodaysTasks();
        res.json(selectedTasks);
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Mark a task as complete
app.post('/tasks/today/:taskId/complete', (req, res) => {
    try {
        const taskId = req.params.taskId;
        const { completed } = req.body; // Get the desired completion state from request body
        const fileContents = fs.readFileSync(TODAYS_TASKS_FILE, 'utf8');
        const todaysTasks = JSON.parse(fileContents);
        
        // Find the task
        const taskIndex = todaysTasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            // Update completion status in today's tasks based on request
            todaysTasks[taskIndex].completed = completed;
            fs.writeFileSync(TODAYS_TASKS_FILE, JSON.stringify(todaysTasks, null, 2));
            
            // Only update last completed time if marking as complete
            if (completed) {
                updateLastCompleted(taskId);
            }
            
            res.json({ success: true });
        } else {
            res.json({ error: 'Task not found in today\'s tasks' });
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