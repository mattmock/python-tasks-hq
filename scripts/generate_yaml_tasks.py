import csv
import yaml
import os
from collections import defaultdict
import re
from pathlib import Path

def sanitize_filename(category):
    # Only allow a-z, A-Z, and _
    name = category.lower().replace('&', 'and')
    name = re.sub(r'[^a-z_]', '_', name.replace(' ', '_'))
    name = re.sub(r'_+', '_', name)  # Collapse multiple underscores
    name = name.strip('_')
    return name + '.yaml'

def generate_task_id(category, index):
    # Only allow alphanumeric and '-'
    category_prefix = ''.join(word[0].upper() for word in re.findall(r'[A-Za-z0-9]+', category))
    return f"{category_prefix}-{index:03d}"

def parse_csv_to_yaml():
    # Dictionary to store tasks by category
    tasks_by_category = defaultdict(list)
    
    # Read the CSV file
    with open('tasks/tasks.csv', 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile, delimiter=';')
        next(reader)  # Skip header row
        
        for row in reader:
            if len(row) >= 4:  # Ensure row has all required fields
                category = row[0].strip('"')
                description = row[1].strip('"')
                complexity = int(row[2])
                time_estimate = float(row[3])
                
                tasks_by_category[category].append({
                    'description': description,
                    'complexity': complexity,
                    'time_estimate': time_estimate
                })
    
    # Generate YAML files for each category
    for category, tasks in tasks_by_category.items():
        # Create YAML structure
        yaml_data = {
            'category': category,
            'tasks': []
        }
        
        # Add tasks with unique IDs
        for idx, task in enumerate(tasks, 1):
            task_id = generate_task_id(category, idx)
            task_data = {
                'id': task_id,
                'description': task['description'],
                'complexity': task['complexity'],
                'time_estimate': task['time_estimate']
            }
            yaml_data['tasks'].append(task_data)
        
        # Create filename from category (sanitize for filesystem)
        filename = sanitize_filename(category)
        filepath = os.path.join('tasks', filename)
        
        # Write YAML file
        with open(filepath, 'w', encoding='utf-8') as yamlfile:
            yaml.dump(yaml_data, yamlfile, default_flow_style=False, sort_keys=False)

def generate_category_files():
    # Read the main tasks YAML file
    with open('data/tasks/tasks.yaml', 'r') as f:
        tasks = yaml.safe_load(f)

    # Group tasks by category
    categories = {}
    for task in tasks:
        category = task['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(task)

    # Create tasks directory if it doesn't exist
    tasks_dir = Path('tasks')
    tasks_dir.mkdir(exist_ok=True)

    # Generate a YAML file for each category
    for category, category_tasks in categories.items():
        # Create a safe filename from the category name
        filename = sanitize_filename(category)
        filepath = tasks_dir / filename

        # Add IDs to tasks
        tasks_with_ids = []
        for idx, task in enumerate(category_tasks, 1):
            task_with_id = task.copy()
            task_with_id['id'] = generate_task_id(category, idx)
            # Ensure title is included
            if 'title' not in task_with_id:
                task_with_id['title'] = task_with_id['description'][:50] + '...'
            tasks_with_ids.append(task_with_id)

        # Write the category tasks to a YAML file
        with open(filepath, 'w') as f:
            yaml.dump({
                'category': category,
                'tasks': tasks_with_ids
            }, f, default_flow_style=False, sort_keys=False)

        print(f"Generated {filepath}")

if __name__ == '__main__':
    generate_category_files() 