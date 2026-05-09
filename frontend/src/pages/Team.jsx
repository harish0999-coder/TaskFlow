import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { usersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import './Team.css'

export default function Team() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersAPI.getAll().then(res => setUsers(res.data)).finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await usersAPI.updateRole(userId, role)
      setUsers(prev => prev.map(u => u._id === userId ? res.data : u))
      toast.success('Role updated!')
    } catch { toast.error('Failed to update role') }
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="loader"/></div>

  const admins = users.filter(u=>u.role==='admin')
  const members = users.filter(u=>u.role==='member')

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{users.length} member{users.length!==1?'s':''} total</p>
        </div>
      </div>

      <div className="team-stats">
        <div className="team-stat"><span className="ts-val">{users.length}</span><span className="ts-label">Total</span></div>
        <div className="team-stat"><span className="ts-val">{admins.length}</span><span className="ts-label">Admins</span></div>
        <div className="team-stat"><span className="ts-val">{members.length}</span><span className="ts-label">Members</span></div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No team members yet</h3></div>
      ) : (
        <div className="team-grid">
          {users.map(u => (
            <div key={u._id} className="team-card">
              <div className="tc-avatar">{u.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
              <div className="tc-info">
                <div className="tc-name">{u.name} {u._id===user._id && <span className="you-tag">you</span>}</div>
                <div className="tc-email">{u.email}</div>
                <div className="tc-meta">
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                  <span className="tc-joined">Joined {format(new Date(u.createdAt),'MMM yyyy')}</span>
                </div>
              </div>
              {user.role==='admin' && u._id !== user._id && (
                <div className="tc-actions">
                  <select className="role-select" value={u.role} onChange={e=>handleRoleChange(u._id,e.target.value)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
