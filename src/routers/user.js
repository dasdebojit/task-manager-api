const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Please upload an Image file (.jpg, .jpeg, .png only)'));
        }

        cb(undefined, true);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, heigh: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send('Avatar uploaded!');
}, (err, req, res, next) => {
    res.status(400).send({error: err.message});
});

router.get("/", (req, res) => {
    res.render('index');
});


router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('Avatar deleted!');
});

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user.avatar || !user) {
            throw new Error('No user or Avatar');
        }
        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);
    } catch(e) {
        res.status(400).send(e);
    }
})


router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user);
    } catch(e) {
        res.status(400).send(e);
    }
})

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save();
        const token = await user.getAuthToken();
        res.send({user, token});
    } catch(e) {
        res.status(400).send(e);
    }
});

router.patch('/users/me', auth, async (req, res)=> {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation) 
        return res.status(400).send('Error: Invalid Updates!');

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();

        res.send(req.user);
    } catch(e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        
        res.send(req.user);
    } catch(e) {
        res.status(400).send(e);
    }
})

router.get('/users/login', (req, res) => {
    res.render('login');
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.getAuthToken();

        res.send({user, token});
    } catch(e) {
        res.status(400).send(e);
    }
});

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save();
        res.send('Successfully Logged Out!');
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Logged Out of all sessions!');
    } catch(e) {
        res.status(400).send(e);
    }
})

module.exports = router;