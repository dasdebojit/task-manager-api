const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

router.post('/tasks', auth, async (req, res) => {
    const task = new Task(req.body);
    task.owner = req.user._id;

    try {
        const savedTask = await task.save();
        res.send(savedTask);
    } catch(e) {
        res.status(400).send(e);
    }
});

// ?completed=true/false
// ?limit=<x>
// ?skip=<y>
// ?sortBy=<property>:<asc/desc>
router.get('/tasks', auth,  async (req, res) => {
    const match = {};
    const sort = {};

    if(req.query.completed)
        match.completed = req.query.completed === 'true';
    
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] == 'asc' ? 1: -1;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        if(!req.user.tasks) 
            return res.send('No task to display!');
        res.status(200).send(req.user.tasks);      
        
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get('/task',  auth, async (req, res) => {
    const taskName = req.body.description;
    try {
        const task = await Task.findOne({ description: taskName, owner: req.user._id });
        
        if (!task) {
            return res.status(404).send()
        }
        res.status(200).send(task)
    } catch (e) {
        res.status(400).send(e);
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) =>  allowedUpdates.includes(update));

    if(!isValidOperation) 
        return res.status(400).send('Invalid request!');
    try {
        const task = await Task.findOne({ _id, owner: req.user._id})
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();

        if(!task)
            return res.status(404).send();
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        await task.remove();
        res.send(task);
    } catch(e) {
        res.status(400).send(e);
    }
});

module.exports = router;