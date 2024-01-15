const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const MongoStore = require('connect-mongo');
const User = require('./models/user');
const Chat = require('./models/chat');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { register } = require('module');
const user = require('./models/user');
const app = express();

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

const dbString = 'mongodb://localhost:27017/chatApp_DB';

mongoose.connect(dbString)
    .then(() => {
        console.log("connection open")
    })
    .catch(err => {
        console.log("Oh no eorror!!")
        console.log(err)
    })

const connection = mongoose.createConnection(dbString);

const sessionStore = new MongoStore({
    mongoUrl: dbString,
    mongooseConnection: connection,
    collection: 'sessions'
});

app.use(
    session({
        secret: 'some secret',
        resave: false,
        saveUninitialized: true,
        store: sessionStore,
        cookie: {
            httpOnly: true,
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get('/', (req, res) => {
    if (!req.isAuthenticated())
        res.redirect('/login');
    else
        res.redirect('/allchats');
})
app.get('/login', (req, res) => {
    res.render('login');
})
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/allchats');
})
app.get('/register', (req, res) => {
    res.render('register');
})
app.post('/register', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username: username })
        const user = await User.register(newUser, password)
        req.logIn(user, (err) => {
            if (err)
                return next(err);
            res.redirect('/allchats')
        })
    } catch {
        console.log(e);
        res.redirect('/register')
    }
})

app.get('/allchats', async (req, res) => {
    const user = await User.findByUsername(req.user.username).populate('friends');
    res.render('ShowList', { user: user })
})
app.post('/add', async (req, res) => {
    const { frnd } = req.body;
    const friend = await User.findByUsername(frnd);
    if (friend) {
        let a = frnd;
        let b = req.user.username;
        if (a > b) {
            let t = a;
            a = b;
            b = t;
        }
        const chatName = a + b;
        const chat = await Chat.find({ windowName: chatName })
        const curuser = await User.findByUsername(req.user.username)
        if (chat.length == 0) {
            const newChat = new Chat({ windowName: chatName });
            await newChat.save();
            curuser.friends.push(friend);
            friend.friends.push(curuser);
            await curuser.save();
            await friend.save();
            res.render('chat', { chat: newChat, user1: curuser, user2: friend });
        }
        else
            res.render('chat', { chat: chat, user1: curuser, user2: friend });
    }
    else
        res.send("USER NOT FOUND!")
})

app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err)
            return next(err);
        res.redirect('/');
    })
})

app.get('/chat/:id', async (req, res) => {
    const { id } = req.params;
    const Oppuser = await User.findById(id);
    const CurrUser = await User.findByUsername(req.user.username);
    let a = Oppuser.username;
    let b = req.user.username;
    if (a > b) {
        let t = a;
        a = b;
        b = t;
    }
    const chatName = a + b;
    const chat = await Chat.findOne({ windowName: chatName })

    res.render('chat', { chat: chat, user1: CurrUser, user2: Oppuser });
})

app.post('/newMsg/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const msg = req.body.msg;

        if (!msg) {
            return res.send("Please type your message first!");
        }

        const Oppuser = await User.findById(id);
        if (!Oppuser) {
            return res.send("Opponent user not found!");
        }

        let a = Oppuser.username;
        let b = req.user.username;

        if (a > b) {
            let t = a;
            a = b;
            b = t;
        }

        const chatName = a + b;        
        let chat = await Chat.findOne({ windowName: chatName });
        chat.messages.push({ msg: msg, user_id: req.user._id });
        await chat.save();

        res.redirect(`/chat/${Oppuser._id}`);
    } catch (e) {
        console.error(e.message);
        res.send(e.message);
    }
});


app.listen(1202, () => {
    console.log('listening on port:1202');
})