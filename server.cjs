const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// In-memory data store using 'taskDone' instead of 'completed'
let todos = [];

// GET: Fetch all todos
app.get('/api/todos', (req, res) => {
    res.status(200).json(todos);
});

// GET: Fetch a single todo by ID
app.get('/api/todos/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.status(200).json(todo);
});

// POST: Create and store a new todo
app.post('/api/todos', (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({ error: 'Title field is required' });
    }

    const newTodo = {
        id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
        title: req.body.title,
        taskDone: req.body.taskDone !== undefined ? req.body.taskDone : false
    };

    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// PUT: Update an existing todo completely
app.put('/api/todos/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    todo.title = req.body.title !== undefined ? req.body.title : todo.title;
    todo.taskDone = req.body.taskDone !== undefined ? req.body.taskDone : todo.taskDone;

    res.status(200).json(todo);
});

// DELETE: Completely remove the node from the array
app.delete('/api/todos/:id', (req, res) => {
    const idToFind = parseInt(req.params.id);
    const exists = todos.some(t => t.id === idToFind);

    if (!exists) return res.status(404).json({ error: 'Todo not found' });

    // Reassign array without the specified node to completely delete it
    todos = todos.filter(t => t.id !== idToFind);
    res.status(204).send();
});

// Start the test server
app.listen(PORT, () => {
    console.log(`Test API running at http://localhost:${PORT}`);
});