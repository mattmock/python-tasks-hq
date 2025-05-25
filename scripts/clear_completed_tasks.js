const fs = require('fs');
const path = require('path');

const COMPLETED_TASKS_FILE = path.join(__dirname, '..', 'data', 'state', 'completed_tasks.json');

// Clear completed_tasks.json by writing an empty array
fs.writeFileSync(COMPLETED_TASKS_FILE, JSON.stringify([], null, 2));
console.log('Cleared completed_tasks.json'); 