var dynamo = require('dynamodb')
dynamo.AWS.config.loadFromPath('credentials.json')
const Joi = require('joi')
var sha256 = require('crypto-js/sha256')

// user model
var User = dynamo.define('User', {
    hashKey: 'username',
    timestamps:true,
    schema: {
        firstName: Joi.string(),
        lastName: Joi.string(),
        username: Joi.string(),
        password: Joi.string(),
        email: Joi.string().email(),
        birthday: Joi.date(),
        friends: dynamo.types.stringSet(),
        online: Joi.boolean(),
        notification: dynamo.types.stringSet(),
    },
})

var createUser = function (username, password, email, firstName, lastName, birthday, callback) {
    User.create({
        username:username,
        password: sha256(password).toString(),
        email:email,
        firstName:firstName,
        lastName: lastName,
        birthday:birthday,
        online: true, 
    }, function (err, user) {
        if (err) {
            console.log(err)
            callback(err, user)
        } else {
            console.log('created user ', user.get('username'))
            callback(err, user)
        }
    })
}

var getUsersByPrefix = function(prefix, username, callback) {
    console.log("in userDB for getUsersByPrefix")
    User.scan().where('username').beginsWith(prefix).exec(function(err, users) {
        callback(err, users.Items.map(user => user.attrs.username))
    })
}

var addFriend = function(username, newFriendUsername, callback) {
    User.get(username, function (err, acc) {
        console.log("got user " + acc)
        friends = acc.get('friends')
        if (!friends) {
            friends = [newFriendUsername]
        } else {
            friends.push(newFriendUsername)
        }
        console.log("friends is of type " + typeof friends)
        User.update({
            username: username,
            friends: friends
        }, function (err, user) {
            callback(err, user)
        })
    })
}

var getUser = function(username, callback) {
    User.get({username: username}, function(err, user) {
        callback(err, user)
    })
}

var getAllUsers = function(callback) {
    User.scan().loadAll().exec(function(err, users) {
        callback(users)
    })
}

var verifyUser = function(username, password, callback) {
    User.get({username: username}, function(err, user) {
        if (err || user == null) {
            callback(err, user)
        } else if (user.get('password') == sha256(password).toString()) {
            console.log("correct password provided")
            callback(err, user)
        } else {
            console.log("incorrect password, or error, found.")
            callback(err, null)
        }
    })
}

var getName = function(username, callback) {
    User.get(username, function (err, user) {
        if (user) callback(null, user.attrs.firstName + " " + user.attrs.lastName)
        else callback(err, null)
    })
}

var logoutUser = function(username, done) {
    User.update({
        username:username,
        online: false
    }, function(err, data) {
        done()
    })
}

var loginUser = function(username, done) {
    User.update({
        username:username,
        online: true
    }, function(err, data) {
        done()
    })
}


var addNotifcation = function(username, notificationID, callback) {
    User.get(username, function(err, user) {
        if (!err && user) {
            var notifications = user.get('notifications') ? user.get('notifications') : [];
            notifications.push(notificationID);
            User.update({
                username: username,
                notifications: notifications
            }, function(_, _) {
                callback(null, null);
            });
        } else {
            callback(null, null);
        }
    })
}

var removeNotifications = function(username, callback) {
    User.update({
        "username":username,
        "notifications":[]
    }, 
    function(err,_){
        console.log(err);
        callback(null, null)});
}

module.exports = {
    get_user: getUser,
    get_name: getName,
    get_all_users: getAllUsers,
    create_user: createUser,
    verify_user: verifyUser,
    add_friend: addFriend,
    get_users_by_prefix: getUsersByPrefix,
    logout_user: logoutUser,
    login_user: loginUser,
    add_notification: addNotifcation,
    remove_notifications: removeNotifications
}

var makeUserTable = function () {
    dynamo.createTables(function (err) {
        if (err) {
            console.log('Error creating tables: ', err)
        } else {
            console.log('Tables has been created')
        }
    })
}
// makeUserTable()
// makeInitialUsers()