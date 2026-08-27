import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('loads the initial todo list successfully', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, title: 'Write docs', taskDone: false }]
    })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(await screen.findByText('Write docs')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/todos')
  })

  it('handles fetch errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as typeof fetch

    render(<App />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    expect(consoleError).toHaveBeenCalled()
  })

  it('ignores failed fetch responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as typeof fetch

    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Tasks: 0')).toBeInTheDocument()
  })

  it('adds a todo when the form is submitted with a valid title', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, title: 'Review code', taskDone: false })
      })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const input = screen.getByPlaceholderText('Add a new task')
    fireEvent.change(input, { target: { value: '   Review code   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(screen.getByText('Review code')).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Review code', taskDone: false })
      })
    )
    expect(input).toHaveValue('')
  })

  it('does not add a todo when the title is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const initialCalls = fetchMock.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(fetchMock).toHaveBeenCalledTimes(initialCalls)

    const input = screen.getByPlaceholderText('Add a new task')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(fetchMock).toHaveBeenCalledTimes(initialCalls)
  })

  it('ignores failed add-todo responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({ ok: false })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const input = screen.getByPlaceholderText('Add a new task')
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
    expect(screen.queryByText('New task')).not.toBeInTheDocument()
  })

  it('handles add-todo request errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockRejectedValue(new Error('Add failed'))

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const input = screen.getByPlaceholderText('Add a new task')
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })
  })

  it('toggles a todo to done', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, title: 'Write docs', taskDone: false },
          { id: 2, title: 'Review code', taskDone: false }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, title: 'Write docs', taskDone: true })
      })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const checkbox = await screen.findByRole('checkbox', { name: 'Mark Write docs as done' })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(checkbox).toBeChecked()
    })
    expect(screen.getByText('Review code')).toBeInTheDocument()
  })

  it('handles toggle errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Write docs', taskDone: false }]
      })
      .mockRejectedValue(new Error('Toggle failed'))

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const checkbox = await screen.findByRole('checkbox', { name: 'Mark Write docs as done' })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })
  })

  it('ignores failed toggle responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Write docs', taskDone: false }]
      })
      .mockResolvedValueOnce({ ok: false })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const checkbox = await screen.findByRole('checkbox', { name: 'Mark Write docs as done' })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
    expect(checkbox).not.toBeChecked()
  })

  it('deletes a todo item', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Write docs', taskDone: false }]
      })
      .mockResolvedValueOnce({ status: 204 })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const deleteButton = await screen.findByRole('button', { name: 'Delete Write docs' })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByText('Write docs')).not.toBeInTheDocument()
    })
  })

  it('handles delete errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Write docs', taskDone: false }]
      })
      .mockRejectedValue(new Error('Delete failed'))

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const deleteButton = await screen.findByRole('button', { name: 'Delete Write docs' })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })
  })

  it('ignores failed delete responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: 'Write docs', taskDone: false }]
      })
      .mockResolvedValueOnce({ status: 200 })

    globalThis.fetch = fetchMock as typeof fetch

    render(<App />)

    const deleteButton = await screen.findByRole('button', { name: 'Delete Write docs' })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
    expect(screen.getByText('Write docs')).toBeInTheDocument()
  })
})
