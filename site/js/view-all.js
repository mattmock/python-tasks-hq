// Function to create a task element for view-all
function createViewAllTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';
    
    let content = '';
    if (task.id) {
        content += `<div class="task-id">${task.id}</div>`;
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

// Function to display view-all
async function displayViewAll() {
    const container = document.getElementById('tasks-container');
    const allTasks = await fetchAllTasks();

    // Display all tasks in categories
    for (const category of allTasks) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';
        
        const titleH2 = document.createElement('h2');
        titleH2.className = 'category-title';
        titleH2.textContent = category.category;
        
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toggle-button';
        toggleButton.textContent = '+';
        
        headerDiv.appendChild(titleH2);
        headerDiv.appendChild(toggleButton);
        categoryDiv.appendChild(headerDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'category-content collapsed';

        category.tasks.forEach(task => {
            contentDiv.appendChild(createViewAllTaskElement(task));
        });

        categoryDiv.appendChild(contentDiv);
        container.appendChild(categoryDiv);

        headerDiv.addEventListener('click', () => {
            contentDiv.classList.toggle('collapsed');
            toggleButton.textContent = contentDiv.classList.contains('collapsed') ? '+' : '−';
        });
    }
}

// Initialize the view-all page when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    // Load js-yaml library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
    script.onload = () => {
        console.log('js-yaml library loaded');
        displayViewAll();
    };
    script.onerror = (error) => {
        console.error('Error loading js-yaml library:', error);
    };
    document.head.appendChild(script);
}); 