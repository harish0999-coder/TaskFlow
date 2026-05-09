import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { to: '/projects', label: 'Projects', icon: '📁' },
    { to: '/tasks', label: 'Tasks', icon: '✓' },
    { to: '/team', label: 'Team', icon: '👥' },
  ]

  return (
    <div className="layout">
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-mark">⚡</span>
          <span className="logo-text">TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">⇥</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
