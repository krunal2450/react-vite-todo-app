import { useEffect, useState } from 'react'
import './App.css'

type Todo = {
  id: number
  title: string
  taskDone: boolean
}

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/todos')
      if (res.ok) {
        const data: Todo[] = await res.json()
        setTodos(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e: any) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, taskDone: false })
      })
      if (res.ok) {
        const created: Todo = await res.json()
        setTodos(prev => [...prev, created])
        setNewTitle('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleTodo = async (todo: Todo) => {
    const updated = { ...todo, taskDone: !todo.taskDone }
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        const data: Todo = await res.json()
        setTodos(prev => prev.map(t => (t.id === data.id ? data : t)))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (res.status === 204) {
        setTodos(prev => prev.filter(t => t.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="todo-app">
      <header className="todo-header">Todo App</header>

      <form className="todo-form" onSubmit={addTodo} aria-label="Add todo">
        <input
          className="todo-input"
          placeholder="Add a new task"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
        />
        <button className="add-btn" type="submit">Add</button>
      </form>

      <section className="todo-list-section">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className="todo-item">
                <label className="todo-row">
                  <input
                    className="todo-checkbox"
                    type="checkbox"
                    checked={todo.taskDone}
                    onChange={() => toggleTodo(todo)}
                    aria-label={`Mark ${todo.title} as ${todo.taskDone ? 'not done' : 'done'}`}
                  />
                  <span className={"todo-title" + (todo.taskDone ? ' completed' : '')}>
                    {todo.title}
                  </span>
                </label>
                <button className="delete-btn" onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="todo-footer">Tasks: {todos.length}</footer>
    </div>
  )
}

export default App
