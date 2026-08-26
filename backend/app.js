
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");

const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require("./routes/productsRouter");
const usersRouter = require("./routes/usersRouter");
const indexRouter = require("./routes/index");

require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scatch")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

const cors = require('cors');

app.use(cors({
    origin: '*', // Allow all origins for now. Change this to the specific Vercel URL in production!
    credentials: true // Important for cookies/sessions to work across domains
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "mysecretkey"
}));

app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Global Middleware to set 'loggedin' variable for views
app.use(function (req, res, next) {
    res.locals.loggedin = req.cookies.token ? true : false;
    next();
});

// Routes
app.use('/', indexRouter);
app.use('/owners', ownersRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} 🤯💦`);
    });
}

module.exports = app;
// Trigger Vercel Deploy
