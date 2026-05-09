import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { tasksAPI, projectsAPI, usersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import './Tasks.css'

function TaskModal({ task, projects, users, onClose, onSave }) {
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description||'', status: task.status,
    priority: task.priority, project: task.project?._id||task.project||'',
    assignee: task.assignee?._id||task.assignee||'',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
  } : { title:'', description:'', status:'todo', priority:'medium', project:'', assignee:'', dueDate:'' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form, assignee: form.assignee||undefined, dueDate: form.dueDate||undefined }
      const res = task ? await tasksAPI.update(task._id, payload) : await tasksAPI.create(payload)
      onSave(res.data); toast.success(task?'Task updated!':'Task created!'); onClose()
    } catch(err) { toast.error(err.response?.data?.message||'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h2 className="modal-title">{task?'Edit Task':'+ New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="What needs to be done?" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Add details..." />
          </div>
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select className="form-select" value={form.project} onChange={e=>setForm({...form,project:e.target.value})} required>
              <option value="">Select a project</option>
              {projects.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="todo">To Do</option><option value="in-progress">In Progress</option>
                <option value="review">Review</option><option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>
                <option value="">Unassigned</option>
                {users.map(u=><option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...':'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [filters, setFilters] = useState({ status:'', priority:'' })
  const [view, setView] = useState('list')

  useEffect(() => {
    Promise.all([tasksAPI.getAll(), projectsAPI.getAll(), usersAPI.getAll()])
      .then(([t,p,u]) => { setTasks(t.data); setProjects(p.data); setUsers(u.data) })
      .finally(()=>setLoading(false))
  }, [])

  const filtered = tasks.filter(t => {
    if (filters.status && t.status !== filters.status) return false
    if (filters.priority && t.priority !== filters.priority) return false
    return true
  })

  const handleSave = (saved) => {
    setTasks(prev => editTask ? prev.map(t=>t._id===saved._id?saved:t) : [saved,...prev])
    setEditTask(null)
  }

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this task?')) return
    await tasksAPI.delete(id)
    setTasks(prev=>prev.filter(t=>t._id!==id))
    toast.success('Task deleted')
  }

  const handleStatusChange = async (id, status) => {
    const res = await tasksAPI.update(id, { status })
    setTasks(prev=>prev.map(t=>t._id===id?res.data:t))
  }

  const columns = ['todo','in-progress','review','done']
  const colLabels = { 'todo':'To Do', 'in-progress':'In Progress', 'review':'Review', 'done':'Done' }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="loader"/></div>

  return (
    <div className="page tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{filtered.length} task{filtered.length!==1?'s':''}</p>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
          <div className="view-toggle">
            <button className={`view-btn ${view==='list'?'active':''}`} onClick={()=>setView('list')}>☰ List</button>
            <button className={`view-btn ${view==='kanban'?'active':''}`} onClick={()=>setView('kanban')}>⊞ Board</button>
          </div>
          <button className="btn btn-primary" onClick={()=>{setEditTask(null);setShowModal(true)}}>+ New Task</button>
        </div>
      </div>

      <div className="tasks-filters">
        <select className="form-select filter-sel" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>
          <option value="">All Status</option>
          <option value="todo">To Do</option><option value="in-progress">In Progress</option>
          <option value="review">Review</option><option value="done">Done</option>
        </select>
        <select className="form-select filter-sel" value={filters.priority} onChange={e=>setFilters({...filters,priority:e.target.value})}>
          <option value="">All Priority</option>
          <option value="low">Low</option><option value="medium">Medium</option>
          <option value="high">High</option><option value="urgent">Urgent</option>
        </select>
      </div>

      {view === 'list' ? (
        <div className="tasks-list-view">
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><h3>No tasks found</h3></div>
          ) : filtered.map(task => (
            <div key={task._id} className="task-row">
              <select className="status-pill" value={task.status} onChange={e=>handleStatusChange(task._id,e.target.value)}
                style={{background: task.status==='done'?'var(--green-dim)':task.status==='in-progress'?'var(--blue-dim)':task.status==='review'?'var(--yellow-dim)':'var(--bg-hover)'}}>
                <option value="todo">To Do</option><option value="in-progress">In Progress</option>
                <option value="review">Review</option><option value="done">Done</option>
              </select>
              <div className="task-row-content">
                <span className="task-row-title">{task.title}</span>
                <span className="task-row-project">📁 {task.project?.name}</span>
              </div>
              <div className="task-row-meta">
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                {task.assignee && <span className="assignee-chip">👤 {task.assignee.name}</span>}
                {task.dueDate && <span className="due-chip">📅 {format(new Date(task.dueDate),'MMM d')}</span>}
                <button className="icon-btn" onClick={()=>{setEditTask(task);setShowModal(true)}}>✏️</button>
                {(user.role==='admin'||task.createdBy?._id===user._id) && (
                  <button className="icon-btn danger" onClick={()=>handleDelete(task._id)}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map(col => (
            <div key={col} className="kanban-col">
              <div className="kanban-col-header">
                <span className={`badge badge-${col}`}>{colLabels[col]}</span>
                <span className="col-count">{filtered.filter(t=>t.status===col).length}</span>
              </div>
              <div className="kanban-cards">
                {filtered.filter(t=>t.status===col).map(task => (
                  <div key={task._id} className="kanban-card">
                    <div className="kanban-card-title">{task.title}</div>
                    <div className="kanban-card-project">📁 {task.project?.name}</div>
                    <div className="kanban-card-foot">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.assignee && <span className="assignee-chip small">👤 {task.assignee.name}</span>}
                    </div>
                    <div className="kanban-actions">
                      <button className="icon-btn" onClick={()=>{setEditTask(task);setShowModal(true)}}>✏️</button>
                      {(user.role==='admin'||task.createdBy?._id===user._id) && (
                        <button className="icon-btn danger" onClick={()=>handleDelete(task._id)}>🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
                {filtered.filter(t=>t.status===col).length===0 && (
                  <div className="kanban-empty">Drop tasks here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <TaskModal task={editTask} projects={projects} users={users} onClose={()=>{setShowModal(false);setEditTask(null)}} onSave={handleSave} />}
    </div>
  )
}
