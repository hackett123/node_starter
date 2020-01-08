var userDB = require('../models/databases/userDB.js')
var friendDB = require('../models/databases/friendDB.js')
var notificationDB = require('../models/databases/notificationDB.js')
var async = require('async')
var misc_fn = require('../misc.js')

var getSplash = function (req, res) {
        //if session has no user, send to login, otherwise render home page.
        if (req.session.user != null) {
            res.redirect('/home')
        }
        res.render('splash.ejs')
}
var getHome = function (req, res) {
    //if session has no user, send to login, otherwise render home page.
    if (req.session.user == null) {
        res.redirect('/login')
    }
    res.render('home.ejs')
}

var getLogin = function (req, res) {
    res.render('forms/login.ejs')
}

var getLogout = function (req, res) {
    userDB.logout_user(req.session.user, function() {
        req.session.user = null
        res.redirect('/login')
    })
    
}

var checkLogin = function (req, res) {
    userDB.verify_user(req.body.username, req.body.password, function (err, post) {
        if (err) {
            console.log(err)
        }
        if (!post) {
            console.log("CAN NOT VERIFY USER")
            res.send(false, 200)
        } else {
            userDB.login_user(req.body.username, function() {
                console.log("VERIFIED USER")
                req.session.user = req.body.username;
                req.session.save()
                res.send(true, 200)
            });
            
            // save session and tell ejs all is done!
            
        }
    });
}

var checkUsername = function (req, res) {
    userDB.get_user(req.body.username, function (err, user) {
        if (err) {
            console.log(err);
        }
        if (!user) {
            console.log("no user found");
            res.send(true, 200) // true if available
        } else {
            console.log("user found " + user.username);
            res.send(false, 200);
        }
    });
}

var getSignup = function (req, res) {
    req.session.user == null;
    res.render('forms/signup.ejs');
}

var createUser = function (req, res) {
    console.log("*****************");
    console.log(req.body.affiliations)
    userDB.create_user(req.body.username, req.body.password, req.body.email, req.body.firstName, req.body.lastName, req.body.birthday, function (err, user) {
        console.log("err: " + err);
        console.log("post: " + user);
        if (err) {
            console.log(err);
        }
        if (!user) {
            res.send(null, 500); // internal server error
        } else {
            // save session and tell ejs all is done!
            req.session.user = req.body.username;
            req.session.save();
            res.send(user, 200);
        }
    });
}

var getUser = function (req, res) {
    console.log("in getUser serverside");
    //req.session.user has the username of the user, so we query for the full object
    userDB.get_user(req.session.user, function (err, user) {
        if (err) {
            console.log(err);
        }
        res.send(user);
    });
}
var getUserObject = function(req, res) {
    var username = req.params.username;
    userDB.get_user(username, function(err, user) {
        res.send(user);
    })
}

var getAllUsernames = function (req, res) {
    // gets all user objects. map and send usernames
    userDB.get_all_users(function (users) {
        res.send(users.Items.map(item => item.attrs.username));
    });
}

var findUsersWithPrefix = function (req, res) {
    console.log("in find users with prefix")
    userDB.get_users_by_prefix(req.body.prefix, req.session.user, function(err, users) {
        if (users) {
            res.send(users)
        }
    })
}

var getMyProfile = function(req, res) {
    getProfile(req, res);
}

var getProfile = function (req, res) {
    if (req.session.user == null) {
        res.redirect("/login");
    } else {
        var username = req.params.user ? req.params.user : req.session.user;
        userDB.get_user(username, function(err, user) {
            if (err || !user) {
                console.log(err);
                console.log(user);
                res.redirect("/home");
            } else {
                res.render('profile.ejs', {pageUsername: username});
            }
        });
    }
}

var areFriends = function(req, res) {
    var otherUsername = req.params.otherUsername;
    console.log("checking if " + req.session.user + " and "+otherUsername + " are friends");
    if (otherUsername === req.session.user || !otherUsername) {
        res.send(true);
    } else {
        friendDB.are_friends(req.session.user, otherUsername, function(err, data) {
            if (err || !data || data === null) { 
                res.send(false);
            } else {
                res.send(true);
            }
        });
    }
}

var getFriends = function(req, res) {
    if (!req.session.user) {
        res.send([]);
    } else {
        friendDB.get_friends(req.session.user, function(err, friends) {
            res.send(friends);
        });
    }
}

var getFriendsOnlineStatus = function(req, res) {
    if (!req.session.user) {
        res.send([]);
    } else {
        friendDB.get_friends(req.session.user, function(err, friends) {
            var out = [];
            async.forEach(friends, function(friend, done) {
                userDB.get_user(friend, function(err, user) {
                    // console.log(user);
                    if (!err && user) {
                        out.push([user.get('username'), user.get('online')]);
                    }
                    done();
                });
            }, function() {
                res.send(out);
            });
        });
    }

}

var createFriendship = function (req,res) {
    friendDB.are_friends(req.body.userA, req.body.userB, function(err, data) {
        if (!data) {
            friendDB.create_friend(req.body.userA, req.body.userB, function(err, data) {
                var userANotification = "You and " + misc_fn.hypername(req.body.userB) + " are now friends!";
                var userBNotification = "You and " + misc_fn.hypername(req.body.userA) + " are now friends!";
                notificationDB.create_notification(userANotification, req.body.userA, function(_,_) {
                    notificationDB.create_notification(userBNotification, req.body.userB, function(_,_) {
                        res.send(data)
                    })
                })
                
            });
        } else {
            //friendship already exists, so send specific result
            res.send("Already friends", 200);
        }
    })
}


var addNotification = function(req, res) {
    var username = req.body.username;
    var notification = req.body.notification;
    notificationDB.create_notification(username, notification, function(_,_) {
        res.send(null);
    });
}

var getNotifications = function(req, res) {
    console.log("IN GET NOTIFICATIONS IN ROUTES.JS");
    var username = req.params.username;
    if (!username) {
        console.log("NO PROVIDED USERNAME!!!");
        res.send(null);
    } else {
        userDB.get_user(username, function(err, user) {
            console.log("GOT A USER HERE");
            if (err || !user) {
                console.log(err);
                res.send("err");
            } else {
                var out = [];
                var notifications = user.get('notifications');
                // console.log("getting notificationIDs");
                // console.log(notifications);
                async.forEach(notifications, function(notificationID, done) {
                    console.log(notificationID);
                    notificationDB.get_notification(notificationID, function(err, notification) {
                        if (!err && notification) {
                            out.push(notification);
                        } 
                        done();
                    });
                }, function() {
                    res.send(out);
                });
            }
        });
    }
}

var removeNotifications = function(req, res) {
    console.log(" in remove notification");
    var notifications = req.body.notifications;
    var username = req.body.username;
    userDB.remove_notifications(username, function(_,_){
        async.forEach(notifications, function(notificationID, done) {
            notificationDB.remove_notification(notificationID, function(err, data) {
                done();
                res.send(err);
            })
        });
    })
    
}

module.exports = {
    get_splash: getSplash,
    get_home: getHome,
    get_signup: getSignup,
    get_login: getLogin,
    get_logout: getLogout,
    check_login: checkLogin,
    check_username: checkUsername,
    create_user: createUser,
    get_user: getUser,
    get_user_object: getUserObject,
    get_all_usernames: getAllUsernames,
    find_users_with_prefix: findUsersWithPrefix,
    get_my_profile: getMyProfile,
    get_profile: getProfile,
    are_friends: areFriends,
    get_friends: getFriends,
    get_friends_online_status: getFriendsOnlineStatus,
    create_friendship: createFriendship,
    add_notification: addNotification,
    get_notifications: getNotifications,
    remove_notifications: removeNotifications
}