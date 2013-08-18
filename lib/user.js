exports.User = User;

var crypto = require('crypto');

/* Class User
 * Checking user privileges
 * 
 * 
 */
function User(module) {
    // array for checked users
    users = [];
}

/* Prototype river
 * add river for indexing users
 * 
 */
User.prototype.river = function(callback) {
    var query_user = "SELECT username AS 'data.user',\n\
                             password AS 'data.pass',\n\
                             salt AS 'data.salt',\n\
                             user_role.role AS 'data.role',\n\
                             'user' AS 'type',\n\
                             role_privilege.privilege AS 'data.privilege' \n\
                        FROM users,\n\
                             user_role,\n\
                             role_privilege \n\
                       WHERE users.user_id = user_role.user_id \n\
                         AND user_role.role = role_privilege.role";
    var river = new River(module);
    river.make(objectType.user,query_user,callback);
};

/* Prototype remove
 * remove river for indexing users
 * 
 */
User.prototype.remove = function(callback) {
    var river = new River(module);
    river.drop(objectType.user,callback);
};

/* Prototype getPrivileges
 * Check acess rights of each user
 * 
 * 
 */
User.prototype.check = function(login,pass,callback) {
    async.detect(users,function(item,callback) {
        if ((item.login === login) && (item.pass === pass)) callback(true);
        else callback(false);
    },function(result){
        if (result) callback(null,true);
        else {
            getDataByField(objectType.user,'data.user',login,function(usrs){
                // if there are users with such login - check user rights
                if (usrs) {
                    var u = {
                        login : login,
                        pass  : pass,
                        role  : null
                    };
                    async.map(usrs,function(user,callback){
                        if ((user.salt) && (user.pass)) {
                            var sha512 = crypto.createHash('sha512');
                            sha512.update(pass + user.salt,'utf8');
                            // if pass are equal
                            if (user.pass === sha512.digest('hex')) {
                                // if role not set before
                                if ((!u.role) && (user.role)) u.role = user.role;
                                callback(null,user.privilege);
                            }
                            else callback();
                        }
                        else callback();
                    },function(err,res) {
                        if ((!err) && (res)) {
                            u.privileges = res;
                            users.push(u);
                            callback(null,true);
                        }
                        else callback(null,false);
                    })
                }
                else callback(null,false);
            });
        }
    });
};

