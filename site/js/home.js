// Function to create a task element for home view
function createHomeTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';
    
    let content = '';
    content += `<span class="task-category">${task.category}</span>`;
    if (task.title) {
        content += `<div class="task-title">${task.title}</div>`;
    }
    content += `
        <div class="task-description">${formatCodeSnippets(task.description)}</div>
        <button class="complete-button page-button">Mark Complete</button>
    `;
    
    taskDiv.innerHTML = content;

    // Add click handler for the complete button
    const completeButton = taskDiv.querySelector('.complete-button');
    completeButton.addEventListener('click', () => {
        taskDiv.classList.toggle('completed');
        completeButton.textContent = taskDiv.classList.contains('completed') ? 'Mark Incomplete' : 'Mark Complete';
    });
    
    return taskDiv;
}

// Function to display home view
async function displayHomeView() {
    console.log('Starting to display home view...');
    const container = document.getElementById('tasks-container');
    console.log('Container found:', container);
    
    try {
        console.log('Fetching all tasks...');
        const allTasks = await fetchAllTasks();
        console.log('Tasks fetched:', allTasks);

        // Display random tasks
        const randomTasks = getRandomTasks(allTasks);
        console.log('Random tasks selected:', randomTasks);
        
        const randomTasksDiv = document.createElement('div');
        randomTasksDiv.className = 'random-tasks';
        
        randomTasks.forEach(task => {
            randomTasksDiv.appendChild(createHomeTaskElement(task));
        });
        
        container.appendChild(randomTasksDiv);

        // Add Finish button (always enabled)
        const finishButton = document.createElement('button');
        finishButton.className = 'finish-button page-button';
        finishButton.textContent = 'Finish';
        finishButton.disabled = false;
        container.appendChild(finishButton);
    } catch (error) {
        console.error('Error in displayHomeView:', error);
    }
}

// Initialize the home view when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    // Load js-yaml library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
    script.onload = () => {
        console.log('js-yaml library loaded');
        displayHomeView();
    };
    script.onerror = (error) => {
        console.error('Error loading js-yaml library:', error);
    };
    document.head.appendChild(script);
}); 