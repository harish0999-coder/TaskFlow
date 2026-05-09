import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { projectsAPI, tasksAPI, usersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import './ProjectDetail.css'

function TaskModal({ task, projectId, users, onClose, onSave }) {
  const [form, setForm] = useState(task ? {
    title:task.title, description:task.description||'', status:task.status,
    priority:task.priority, assignee:task.assignee?._id||'',
    dueDate:task.dueDate?task.dueDate.split('T')[0]:''
  } : { title:'', description:'', status:'todo', priority:'medium', assignee:'', dueDate:'' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { ...form, project: projectId, assignee:form.assignee||undefined, dueDate:form.dueDate||undefined }
      const res = task ? await tasksAPI.update(task._id, payload) : await tasksAPI.create(payload)
      onSave(res.data); toast.success(task?'Updated!':'Task created!'); onClose()
    } catch(err) { toast.error('Error saving task') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h2 className="modal-title">{task?'Edit Task':'+ Add Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="Task title" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Details..." />
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
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...':'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [addMemberEmail, setAddMemberEmail] = useState('')

  useEffect(() => {
    Promise.all([projectsAPI.getOne(id), projectsAPI.getTasks(id), usersAPI.getAll()])
      .then(([p, t, u]) => { setProject(p.data); setTasks(t.data); setUsers(u.data) })
      .finally(() => setLoading(false))
  }, [id])

  const handleTaskSave = (saved) => {
    setTasks(prev => editTask ? prev.map(t=>t._id===saved._id?saved:t) : [saved,...prev])
    setEditTask(null)
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    await tasksAPI.delete(taskId)
    setTasks(prev=>prev.filter(t=>t._id!==taskId))
    toast.success('Task deleted')
  }

  const handleStatusChange = async (taskId, status) => {
    const res = await tasksAPI.update(taskId, { status })
    setTasks(prev=>prev.map(t=>t._id===taskId?res.data:t))
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    const found = users.find(u => u.email.toLowerCase() === addMemberEmail.toLowerCase())
    if (!found) return toast.error('User not found with that email')
    try {
      const res = await projectsAPI.addMember(id, found._id)
      setProject(res.data); setAddMemberEmail('')
      toast.success(`${found.name} added to project!`)
    } catch(err) { toast.error(err.response?.data?.message||'Error') }
  }

  const columns = ['todo','in-progress','review','done']
  const colLabels = { 'todo':'To Do','in-progress':'In Progress','review':'Review','done':'Done' }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="loader"/></div>
  if (!project) return <div className="page"><p>Project not found.</p></div>

  const done = tasks.filter(t=>t.status==='done').length
  const progress = tasks.length ? Math.round((done/tasks.length)*100) : 0

  return (
    <div className="page project-detail">
      <button className="back-btn" onClick={()=>navigate('/projects')}>← Back to Projects</button>

      <div className="pd-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="pd-desc">{project.description}</p>}
          <div className="pd-badges">
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            <span className={`badge badge-${project.priority}`}>{project.priority}</span>
            {project.dueDate && <span className="pd-due">Due {format(new Date(project.dueDate),'MMM d, yyyy')}</span>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={()=>{setEditTask(null);setShowTaskModal(true)}}>+ Add Task</button>
      </div>

      <div className="pd-progress">
        <div className="progress-info">
          <span className="progress-label">Progress</span>
          <span className="progress-pct">{progress}%</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
        <p className="progress-sub">{done} of {tasks.length} tasks completed</p>
      </div>

      <div className="pd-grid">
        <div className="pd-main">
          <div className="pd-section-header">
            <h2 className="pd-section-title">Tasks ({tasks.length})</h2>
          </div>
          <div className="kanban-board">
            {columns.map(col => (
              <div key={col} className="kanban-col">
                <div className="kanban-col-header">
                  <span className={`badge badge-${col}`}>{colLabels[col]}</span>
                  <span className="col-count">{tasks.filter(t=>t.status===col).length}</span>
                </div>
                <div className="kanban-cards">
                  {tasks.filter(t=>t.status===col).map(task => (
                    <div key={task._id} className="kanban-card">
                      <div className="kanban-card-title">{task.title}</div>
                      {task.description && <div className="kanban-card-desc">{task.description}</div>}
                      <div className="kanban-card-foot">
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.assignee && <span className="assignee-chip small">👤 {task.assignee.name}</span>}
                        {task.dueDate && <span className="due-chip">📅 {format(new Date(task.dueDate),'MMM d')}</span>}
                      </div>
                      <select className="status-mini" value={task.status} onChange={e=>handleStatusChange(task._id,e.target.value)}>
                        <option value="todo">To Do</option><option value="in-progress">In Progress</option>
                        <option value="review">Review</option><option value="done">Done</option>
                      </select>
                      <div className="kanban-actions">
                        <button className="icon-btn" onClick={()=>{setEditTask(task);setShowTaskModal(true)}}>✏️</button>
                        {(user.role==='admin'||task.createdBy?._id===user._id) && (
                          <button className="icon-btn danger" onClick={()=>handleDeleteTask(task._id)}>🗑️</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {tasks.filter(t=>t.status===col).length===0&&<div className="kanban-empty">Empty</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pd-sidebar">
          <div className="pd-widget">
            <h3 className="widget-title">Team Members</h3>
            <div className="members-list">
              <div className="member-row">
                <div className="member-avatar">{project.owner?.name?.charAt(0)}</div>
                <div>
                  <div className="member-name">{project.owner?.name}</div>
                  <span className="badge badge-admin">Owner</span>
                </div>
              </div>
              {project.members?.filter(m=>m._id!==project.owner?._id).map(m => (
                <div key={m._id} className="member-row">
                  <div className="member-avatar">{m.name?.charAt(0)}</div>
                  <div>
                    <div className="member-name">{m.name}</div>
                    <span className="member-email">{m.email}</span>
                  </div>
                </div>
              ))}
            </div>

            {(user.role==='admin'||project.owner?._id===user._id) && (
              <form onSubmit={handleAddMember} className="add-member-form">
                <input className="form-input" placeholder="member@email.com" value={addMemberEmail} onChange={e=>setAddMemberEmail(e.target.value)} type="email" />
                <button type="submit" className="btn btn-secondary" style={{marginTop:8,width:'100%',justifyContent:'center'}}>+ Add Member</button>
              </form>
            )}
          </div>

          <div className="pd-widget">
            <h3 className="widget-title">Stats</h3>
            {columns.map(col=>(
              <div key={col} className="stat-row">
                <span className={`badge badge-${col}`}>{colLabels[col]}</span>
                <span className="stat-count">{tasks.filter(t=>t.status===col).length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTaskModal && <TaskModal task={editTask} projectId={id} users={users} onClose={()=>{setShowTaskModal(false);setEditTask(null)}} onSave={handleTaskSave} />}
    </div>
  )
}
