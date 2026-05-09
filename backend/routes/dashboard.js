const express = require('express');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const totalProjects = query(`SELECT COUNT(*) as count FROM projects WHERE owner_id=? OR id IN (SELECT project_id FROM project_members WHERE user_id=?)`, [userId, userId])[0]?.count || 0;
  const totalTasks = query(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE owner_id=? OR id IN (SELECT project_id FROM project_members WHERE user_id=?))`, [userId, userId])[0]?.count || 0;
  const myTasks = query('SELECT COUNT(*) as count FROM tasks WHERE assignee_id=?', [userId])[0]?.count || 0;
  const overdueTasks = query(`SELECT COUNT(*) as count FROM tasks WHERE assignee_id=? AND due_date < ? AND status != 'done'`, [userId, today])[0]?.count || 0;

  const tasksByStatus = query(`SELECT status, COUNT(*) as count FROM tasks WHERE assignee_id=? GROUP BY status`, [userId]);
  const recentTasks = query(`SELECT t.*, p.name as project_name, u.name as assignee_name FROM tasks t
    LEFT JOIN projects p ON t.project_id=p.id LEFT JOIN users u ON t.assignee_id=u.id
    WHERE t.project_id IN (SELECT id FROM projects WHERE owner_id=? OR id IN (SELECT project_id FROM project_members WHERE user_id=?))
    ORDER BY t.created_at DESC LIMIT 10`, [userId, userId]);
  const upcomingDeadlines = query(`SELECT t.*, p.name as project_name FROM tasks t
    LEFT JOIN projects p ON t.project_id=p.id
    WHERE t.assignee_id=? AND t.due_date >= ? AND t.status != 'done'
    ORDER BY t.due_date ASC LIMIT 5`, [userId, today]);

  res.json({ totalProjects, totalTasks, myTasks, overdueTasks, tasksByStatus, recentTasks, upcomingDeadlines });
});

module.exports = router;
