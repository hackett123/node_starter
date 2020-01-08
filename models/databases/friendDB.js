var dynamo = require('dynamodb');
var users = require('./userDB.js');
var async = require('async');
dynamo.AWS.config.loadFromPath('credentials.json');
const Joi = require('joi');

// Friend model
var Friend = dynamo.define('Friend', {
    hashKey: 'username',
    rangeKey: 'friendUsername',
    timestamps: true,
    schema: {
        username: Joi.string(),
        friendUsername: Joi.string(),
    }
});

var createFriend = function (userA, userB, callback) {
    // TODO: check that both users exist
    users.get_user(userA, function (err, user) {
        if (!user || err) {
            callback(err, "");
            return;
        }
    });

    // add friend to string set in the user table (bidrectional)
    f = function () { };
    users.add_friend(userA, userB, f);
    users.add_friend(userB, userA, f);

    // add userA-userB AND userB-userA
    var usernames = [userA, userB];
    var other = createOther(userA, userB);
    var friendships = []
    var errs = []
    async.forEach(usernames, function (user, userCallback) {
        Friend.create({
            username: user,
            friendUsername: other[user]
        }, function (err, friendship) {
            if (err) {
                console.log(err);
                errs.push(err);
            } else {
                console.log('created friendship ', friendship.get('username'), friendship.get('friendUsername'));
                friendships.push(friendship);
            }
            userCallback();
        })
    }, function () {
        callback(errs, friendships);
    })
};

var createOther = function (userA, userB) {
    var out = {};
    out[userA] = userB;
    out[userB] = userA;
    return out;
}

var makeInitialFriends = function () {
    var f = function (err, data) { };
    createFriend('noah', 'michael', f);
    createFriend('noah', 'kara', f);
    createFriend('michael', 'kara', f);
}

// checks if users are friends... should this have different name?
var areFriends = function (userA, userB, callback) {
    Friend.get({ username: userA, friendUsername: userB }, function (err, friendship) {
        callback(err, friendship)
    });
};

// returns list of friends for given user
var getFriends = function (username, callback) {
    Friend.query(username).loadAll().attributes(['friendUsername']).exec(function (err, friendship) {
        if (err) {
            callback(err, friendship);
        } else {
            callback(err, friendship.Items.map(function (x) { return JSON.parse(JSON.stringify(x)).friendUsername }));
        }
    });
};

// returns filtered list of friends by prefix for given user
var getFriendsByPrefix = function (prefix, username, callback) {
    Friend.query(username).loadAll().where('friendUsername').beginsWith(prefix).exec(function (err, friendship) {
        callback(err, friendship.Items.map(friend => friend.attrs.friendUsername))
    })
}

var destroyFriend = function (userA, userB, callback) {
    Friend.destroy(userA, userB, function (err1) {
        Friend.destroy(userB, userA, function (err2) {
            if (!err1 && !err2) {
                callback(null, "success");
            } else {
                if (err1) {
                    callback(err1, "failure");
                } else if (err2) {
                    callback(err2, "failure");
                }
            }
        })
    })
};

module.exports = {
    create_friend: createFriend,
    destroy_friend: destroyFriend,
    get_friends: getFriends,
    get_friends_by_prefix: getFriendsByPrefix,
    are_friends: areFriends
}

// dynamo.createTables(function (err) {
//     if (err) {
//         console.log('Error creating tables: ', err);
//     } else {
//         console.log('Tables has been created');
//     }
// });