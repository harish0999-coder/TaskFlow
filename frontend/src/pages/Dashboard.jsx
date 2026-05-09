import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsAPI, tasksAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([projectsAPI.getAll(), tasksAPI.getAll(), tasksAPI.getOverdue()])
      .then(([p, t, o]) => { setProjects(p.data); setTasks(t.data); setOverdue(o.data) })
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: overdue.length,
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="loader"/></div>

  return (
    <div className="page">
      <div className="dash-hero">
        <div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your team today.</p>
        </div>
        <div className="dash-date">{format(new Date(), 'EEEE, MMM d')}</div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'accent', icon: '📋' },
          { label: 'In Progress', value: stats.inProgress, color: 'blue', icon: '⚡' },
          { label: 'Completed', value: stats.done, color: 'green', icon: '✅' },
          { label: 'Overdue', value: stats.overdue, color: 'red', icon: '⚠️' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`stat-card stat-${color}`}>
            <span className="stat-icon">{icon}</span>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <div className="panel-header">
            <h2 className="panel-title">Recent Tasks</h2>
            <Link to="/tasks" className="panel-link">View all →</Link>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📝</div><h3>No tasks yet</h3></div>
          ) : (
            <div className="item-list">
              {tasks.slice(0, 6).map(task => (
                <div key={task._id} className="list-item">
                  <div className="list-item-body">
                    <span className="list-item-title">{task.title}</span>
                    <span className="list-item-sub">{task.project?.name}</span>
                  </div>
                  <div className="list-item-meta">
                    <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-panel">
          <div className="panel-header">
            <h2 className="panel-title">Active Projects</h2>
            <Link to="/projects" className="panel-link">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📁</div><h3>No projects yet</h3></div>
          ) : (
            <div className="item-list">
              {projects.slice(0, 5).map(project => (
                <Link key={project._id} to={`/projects/${project._id}`} className="list-item clickable">
                  <div className={`status-dot dot-${project.status}`} />
                  <div className="list-item-body">
                    <span className="list-item-title">{project.name}</span>
                    <span className="list-item-sub">by {project.owner?.name} · {project.members?.length || 0} members</span>
                  </div>
                  <span className={`badge badge-${project.status}`}>{project.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="overdue-panel">
          <div className="panel-header">
            <h2 className="panel-title" style={{ color: 'var(--red)' }}>⚠️ Overdue Tasks</h2>
          </div>
          <div className="item-list">
            {overdue.map(task => (
              <div key={task._id} className="list-item overdue-item">
                <div className="list-item-body">
                  <span className="list-item-title">{task.title}</span>
                  <span className="list-item-sub">{task.project?.name}</span>
                </div>
                <div className="list-item-meta">
                  <span className="overdue-tag">Due {format(new Date(task.dueDate), 'MMM d')}</span>
                  <span className="assignee-chip">{task.assignee?.name || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
