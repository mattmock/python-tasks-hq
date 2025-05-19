// Function to get random tasks from all categories
function getRandomTasks(allTasks, count = 8) {
    const flattenedTasks = allTasks.flatMap(category => 
        category.tasks.map(task => ({
            ...task,
            category: category.category
        }))
    );
    
    // Fisher-Yates shuffle algorithm
    for (let i = flattenedTasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flattenedTasks[i], flattenedTasks[j]] = [flattenedTasks[j], flattenedTasks[i]];
    }
    
    return flattenedTasks.slice(0, count);
}

// Function to format code snippets in text
function formatCodeSnippets(text) {
    // Replace code blocks (text between triple backticks)
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Replace inline code (text between single backticks)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    return text;
}

// Function to fetch all tasks from YAML files
async function fetchAllTasks() {
    console.log('Starting to fetch all tasks...');
    let allTasks = [];
    try {
        console.log('Fetching directory listing...');
        const response = await fetch('/tasks/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        console.log('Directory listing received');
        
        // Parse the directory listing HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get all links that end with .yaml
        const links = Array.from(doc.querySelectorAll('a'))
            .map(a => a.href)
            .filter(href => href.endsWith('.yaml'))
            .map(href => href.split('/').pop());
            
        console.log('Found YAML files:', links);

        // Collect all tasks
        for (const yamlFile of links) {
            try {
                console.log('Fetching YAML file:', yamlFile);
                const yamlResponse = await fetch(`/tasks/${yamlFile}`);
                if (!yamlResponse.ok) {
                    throw new Error(`HTTP error! status: ${yamlResponse.status}`);
                }
                const yamlText = await yamlResponse.text();
                const data = jsyaml.load(yamlText);
                if (data && data.tasks) {
                    allTasks.push({
                        category: data.category,
                        tasks: data.tasks
                    });
                }
                console.log('Successfully loaded:', yamlFile);
            } catch (error) {
                console.error(`Error fetching ${yamlFile}:`, error);
            }
        }
    } catch (error) {
        console.error('Error fetching directory listing:', error);
    }
    console.log('Total tasks loaded:', allTasks.length);
    return allTasks;
}

// Function to create a task element
function createTaskElement(task, showCategory = false) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task';
    
    let content = '';
    if (showCategory) {
        content += `<span class="task-category">${task.category}</span>`;
    }

    // Format the description to handle code snippets
    let description = task.description;
    // Replace code blocks (text between triple backticks)
    description = description.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Replace inline code (text between single backticks)
    description = description.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Add task ID in admin view
    const isAdminView = window.location.pathname.includes('view-all.html');
    if (isAdminView && task.id) {
        content += `<div class="task-id">${task.id}</div>`;
    }
    
    content += `
        <div class="task-description">${description}</div>
        <button class="complete-button page-button">Mark Complete</button>
    `;
    
    taskDiv.innerHTML = content;

    // Add click handler for the complete button
    const completeButton = taskDiv.querySelector('.complete-button');
    completeButton.addEventListener('click', () => {
        taskDiv.classList.toggle('completed');
        completeButton.textContent = taskDiv.classList.contains('completed') ? 'Mark Incomplete' : 'Mark Complete';
        updateFinishButton();
    });
    
    return taskDiv;
}

// Function to update the Finish button state
function updateFinishButton() {
    const tasks = document.querySelectorAll('.random-tasks .task');
    const finishButton = document.querySelector('.finish-button');
    const allCompleted = Array.from(tasks).every(task => task.classList.contains('completed'));
    finishButton.disabled = !allCompleted;
}

// Function to fetch and display YAML data
async function fetchAndDisplayTasks() {
    const container = document.getElementById('tasks-container');
    const isAdminView = window.location.pathname.includes('view-all.html');
    let allTasks = [];

    try {
        const response = await fetch('/tasks/');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a')).map(a => a.href);
        const yamlFiles = links.filter(link => link.endsWith('.yaml'))
            .map(link => link.split('/').pop());

        // First, collect all tasks
        for (const yamlFile of yamlFiles) {
            try {
                const yamlResponse = await fetch(`/tasks/${yamlFile}`);
                const yamlText = await yamlResponse.text();
                const data = jsyaml.load(yamlText);
                allTasks.push(data);
            } catch (error) {
                console.error(`Error fetching ${yamlFile}:`, error);
            }
        }

        if (isAdminView) {
            // Display all tasks in categories for admin view
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
                    contentDiv.appendChild(createTaskElement(task));
                });

                categoryDiv.appendChild(contentDiv);
                container.appendChild(categoryDiv);

                headerDiv.addEventListener('click', () => {
                    contentDiv.classList.toggle('collapsed');
                    toggleButton.textContent = contentDiv.classList.contains('collapsed') ? '+' : '−';
                });
            }
        } else {
            // Display random tasks for main view
            const randomTasks = getRandomTasks(allTasks);
            const randomTasksDiv = document.createElement('div');
            randomTasksDiv.className = 'random-tasks';
            
            randomTasks.forEach(task => {
                randomTasksDiv.appendChild(createTaskElement(task, true));
            });
            
            container.appendChild(randomTasksDiv);

            // Add Finish button
            const finishButton = document.createElement('button');
            finishButton.className = 'finish-button page-button';
            finishButton.textContent = 'Finish';
            finishButton.disabled = true;
            container.appendChild(finishButton);
        }
    } catch (error) {
        console.error('Error fetching directory listing:', error);
    }
} 