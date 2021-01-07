const express = require('express');
const path = require('path');
const hbs = require('hbs');
const bodyParser = require('body-parser');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

// Define paths for Express config
const publicPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

// Setup handlebars engine and views path
app.set('view engine', 'hbs');

app.use(express.static(publicPath));
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);

// To give json response on requests
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));


// Routers
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log('Server is listening on port', port)
});

