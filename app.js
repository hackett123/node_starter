// imports
var express = require('express');
var session = require('express-session');
var routes = require('./routes/routes.js');
// var messenger_routes = require('./routes/messenger_routes.js');
// var visualizer_routes = require('./routes/visualizer_routes.js');
var favicon = require('serve-favicon');
var path = require('path')


var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = 4000

app.use(express.bodyParser());
app.use(express.logger("default"));

// NOAH: okay to add this ?
app.use('/', express.static(__dirname + "/views/static", { maxAge: 1 }));


app.use(session({
    resave: false,
    saveUnitialized: false,
    secret: "don't tell!"
}));


//app.use(favicon(path.join(__dirname, 'images', 'favicon.ico')))
io.on('connection', function (socket) {
    socket.on('set-username', function (username) {
        socket.nickname = username
        console.log("recorded username of " + username)
    })

    socket.on('join', function (room) {
        socket.join(room);
        socket.room = room;
        console.log("joined room " + socket.room)
    })

    socket.on('room message', function (room, username, msg) {
        console.log("room: " + room)
        console.log("message: " + msg)
        messenger_routes.emit_room_message(io, room, username, 'room message', msg)
    })
});
app.get('/favicon.ico', function(req, res) {
    console.log("RECIEVED FAVICON REQUEST")
    res.sendfile('./images/favicon.ico')
})
app.get('/', routes.get_splash)
app.get('/home', routes.get_home)
app.get('/login', routes.get_login)
app.get('/logout', routes.get_logout)
app.get('/signup', routes.get_signup)
app.post('/checkLogin', routes.check_login)
app.post('/checkUsername', routes.check_username)
app.post('/createUser', routes.create_user)
app.get('/getUser', routes.get_user)
app.get('/getUserObject/:username', routes.get_user_object)
app.get('/getAllUsernames', routes.get_all_usernames)
app.post('/findUsersWithPrefix', routes.find_users_with_prefix)

app.get('/areFriends/:otherUsername', routes.are_friends)
app.post('/createFriendship', routes.create_friendship)
app.get('/getAllFriends', routes.get_friends)
app.get('/getFriendsOnlineStatus', routes.get_friends_online_status)

app.get('/profile', routes.get_my_profile)
app.get('/profile/:user', routes.get_profile)

// notifications
app.post('/addNotification', routes.add_notification)
app.get('/getNotifications/:username', routes.get_notifications)
app.post('/removeNotifications', routes.remove_notifications)

// custom handling of 404 returns. DO NOT MOVE THIS, location matters
app.use(function (req, res, next) {
    res.status(404).render('404.ejs')
})

// commenting out pennbook code
// // route definitions
// app.get('/', routes.get_splash);
// app.get('/home', routes.get_home);
// app.get('/login', routes.get_login);
// app.get('/logout', routes.get_logout);
// app.get('/signup', routes.get_signup);
// app.get('/about', routes.get_about);
// app.post('/checkLogin', routes.check_login);
// app.post('/checkUsername', routes.check_username);
// app.post('/createUser', routes.create_user);
// app.get('/getUser', routes.get_user);
// app.get('/getAllUsernames', routes.get_all_usernames);
// app.get('/areFriends/:otherUsername', routes.are_friends);
// app.post('/createFriendship', routes.create_friendship);
// app.get('/getAllFriends', routes.get_friends);
// app.post('/findUsersWithPrefix', routes.find_users_with_prefix)
// app.get('/getFriendsOnlineStatus', routes.get_friends_online_status);

// app.post('/likePost/:postID/:liker', routes.like_post);

// app.get('/getUserObject/:username', routes.get_user_object);

// // notifications
// app.post('/addNotification', routes.add_notification);
// app.get('/getNotifications/:username', routes.get_notifications);
// app.post('/removeNotifications', routes.remove_notifications)


// // for profile
// app.get('/profile', routes.get_my_profile);
// app.get('/profile/:user', routes.get_profile);
// app.get('/getWallPosts/:username', routes.get_wall_posts);
// app.post('/createPost', routes.create_post);
// app.post('/createComment', routes.create_comment);

// // for home
// app.get('/getFeedPosts/:username', routes.get_feed_posts);



// app.get('/getPost/:postID', routes.get_post); // not currently used, but keep just in case

// // visualizer route definitions
// app.get('/visualizer', visualizer_routes.start_visualizer); // NOAH TODO: change route name
// app.get('/friendvisualization', visualizer_routes.friend_visualization);
// app.get('/getFriends/:user', visualizer_routes.get_friends);


// // messenger route defintions
// app.get('/messenger', messenger_routes.messenger);
// app.post('/findFriendsWithPrefix', messenger_routes.find_friends_with_prefix);
// app.get('/getMessages', messenger_routes.get_messages);
// app.get('/getChatsAsUsernames', messenger_routes.get_chats_as_usernames);

// run server - we use the http server we made so that express doesn't make a new one and ignore socket.io
http.listen(port);
console.log(`PennBook server running on ${port}!`);