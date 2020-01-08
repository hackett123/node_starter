var dynamo = require('dynamodb');
dynamo.AWS.config.loadFromPath('credentials.json');
const Joi = require('joi');
var userDB = require('./userDB.js');

// Notification model
var Notification = dynamo.define('Notification', {
    hashKey: 'notificationID',
    timestamps:true,
    schema: {
        notificationID: dynamo.types.uuid(),
        content: Joi.string(),
    },
});

var createNotification = function(content, username, callback) {
    Notification.create({"content":content}, function(err, notification) {
        if (err) {
            console.log("error creating notification");
            console.log(err);
        }
        if (!err && notification) {
            userDB.add_notification(username, notification.get('notificationID'), function(_,_) 
                {callback(null, null);
            });    
        } else {
            callback(null, null);
        }
        
    });
}

var getNotification = function(notificationID, callback) {
    Notification.get(notificationID, function(err, notification) {
        callback(err, notification);
    });
}

var removeNotification = function(notificationID, callback) {
    Notification.destroy(notificationID, function(_, _) {
        callback(null, null);
    });
}

var makeTable = function () {
    dynamo.createTables(function (err) {
        if (err) {
            console.log('Error creating tables: ', err);
        } else {
            console.log('Tables has been created');
        }
    });

}


module.exports = {
    get_notification: getNotification,
    remove_notification: removeNotification,
    create_notification: createNotification
}
//makeTable()