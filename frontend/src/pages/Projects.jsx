import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { projectsAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import './Projects.css'

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project ? {
    name: project.name, description: project.description || '',
    status: project.status, priority: project.priority,
    dueDate: project.dueDate ? project.dueDate.split('T')[0] : ''
  } : { name: '', description: '', status: 'active', priority: 'medium', dueDate: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = project ? await projectsAPI.update(project._id, form) : await projectsAPI.create(form)
      onSave(res.data)
      toast.success(project ? 'Project updated!' : 'Project created!')
      onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{project ? 'Edit Project' : '+ New Project'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="E.g. Website Redesign" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What is this project about?" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...':'Save Project'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    projectsAPI.getAll().then(res => setProjects(res.data)).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  const handleSave = (saved) => {
    setProjects(prev => editProject ? prev.map(p => p._id === saved._id ? saved : p) : [saved, ...prev])
    setEditProject(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return
    await projectsAPI.delete(id)
    setProjects(prev => prev.filter(p => p._id !== id))
    toast.success('Project deleted')
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="loader"/></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true) }}>+ New Project</button>
      </div>

      <div className="filter-tabs">
        {['all','active','on-hold','completed'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.replace('-',' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📁</div><h3>No projects found</h3><p>Create your first project to get started</p></div>
      ) : (
        <div className="projects-grid">
          {filtered.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-card-top">
                <div className="project-badges">
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                  <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                </div>
                {(user.role === 'admin' || project.owner?._id === user._id) && (
                  <div className="project-actions">
                    <button className="icon-btn" onClick={() => { setEditProject(project); setShowModal(true) }}>✏️</button>
                    <button className="icon-btn danger" onClick={() => handleDelete(project._id)}>🗑️</button>
                  </div>
                )}
              </div>

              <Link to={`/projects/${project._id}`} className="project-name">{project.name}</Link>
              {project.description && <p className="project-desc">{project.description}</p>}

              <div className="project-card-footer">
                <div className="project-info">
                  <span className="project-owner">👤 {project.owner?.name}</span>
                  {project.dueDate && <span className="project-due">📅 {format(new Date(project.dueDate), 'MMM d, yyyy')}</span>}
                </div>
                <div className="project-avatars">
                  {project.members?.slice(0,3).map((m,i) => (
                    <div key={m._id} className="member-avatar" style={{zIndex:3-i}} title={m.name}>{m.name?.charAt(0).toUpperCase()}</div>
                  ))}
                  {project.members?.length > 3 && <div className="member-avatar">+{project.members.length-3}</div>}
                </div>
              </div>
              <Link to={`/projects/${project._id}`} className="project-enter-btn">Open Project →</Link>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal project={editProject} onClose={() => { setShowModal(false); setEditProject(null) }} onSave={handleSave} />}
    </div>
  )
}
