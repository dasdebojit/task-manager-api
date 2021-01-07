const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        } 
    }],
    avatar: {
        type: Buffer
    }
}, {timestamps: true});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//Middlewares:
// getting Authentication Token for maintaining login information
// everytime an user logins, a new token is appended to
// the tokens array
userSchema.methods.getAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat( {token} );
    await user.save();
    return token;
}

// deleting sensitive informations whenever res.send() is called
// res.send() automatically calles method JSON.stringify()
// which automatically runs this code to achieve this.
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.tokens;
    delete user.password;
    delete user.avatar;

    return user;
}

// If we want our middleware to perform actions on the
// complete collection instead of considering a single
// document, we can use statics.<<function_name>> to 
// define our function and use it in our index.js
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Login Failed!');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw new Error('Login Failed!');
    }
    return user;
}

// middleware to perform like trigger which runs before
// an user is saved. It hashes the password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
})

// middleware to perform like trigger whenever an user is
// removed, all its corresponding tasks should also be removed
// Cascade-delete
userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({ owner: req.user._id });
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;