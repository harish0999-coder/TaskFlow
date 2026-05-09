const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch { res.status(401).json({ message: 'Invalid token' }); }
};

router.get('/overdue', auth, async (req, res) => {
  try {
    let query = { dueDate: { $lt: new Date() }, status: { $ne: 'done' } };
    if (req.user.role !== 'admin') {
      const projects = await Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] });
      query.project = { $in: projects.map(p => p._id) };
    }
    const tasks = await Task.find(query).populate('assignee', 'name email').populate('project', 'name');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = {};
    if (req.user.role !== 'admin') {
      const projects = await Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] });
      query.project = { $in: projects.map(p => p._id) };
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    const tasks = await Task.find(query)
      .populate('assignee', 'name email').populate('createdBy', 'name email')
      .populate('project', 'name').sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email').populate('createdBy', 'name email')
      .populate('project', 'name').populate('comments.author', 'name email');
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name');
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignee', 'name email').populate('createdBy', 'name email').populate('project', 'name');
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    task.comments.push({ text: req.body.text, author: req.user._id });
    await task.save();
    await task.populate('comments.author', 'name email');
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;