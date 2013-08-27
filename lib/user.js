exports.User = User;

/* Class User
 * checking user privileges, storing user data
 */

function User() {
    // local store for user data
    _users = [];
}

/* Prototype update
 * check saved users, and remove expired
 * 
 * @param {type} callback
 * @returns {undefined}
 */
User.prototype.update = function(callback) {
    // function for update users    
    setInterval(function() {
        async.filter(_users,function(item,callback){
            if (item.exp < (new Date()).valueOf()) _users.splice(_users.indexOf(item),1);
            callback();
        },function(res){
            if (callback) callback();
        });
        // update session every 1 minute
    },1*60*1000);
};

/* Prototype river
 * add river for indexing users
 * 
 */
User.prototype.river = function(callback) {
    // get list of users with user details
    var query_user =     "SELECT username AS 'data.user',\n\
                                 person_id AS 'data.person',\n\
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
    // get list of accessor groups
    var query_groups_acc =   "SELECT security_group_id AS 'data.id',\n\
                                 person_id AS 'data.person',\n\
                                 'user_access' AS 'type' \n\
                            FROM raxacore_security_group_accessor_map";
    // get list of person map groups
    var query_groups_person =   "SELECT security_group_id AS 'data.id',\n\
                                 person_id AS 'data.person',\n\
                                 'user_resource' AS 'type' \n\
                            FROM raxacore_security_group_person_map";
    // river all resources in parallel
    async.parallel([
        function(callback) {
            var river = new River();
            river.make(objectType.user,query_user,callback);
        },
        function(callback) {
            var river = new River();
            river.make(objectType.user_access,query_groups_acc,callback);
        },
        function(callback) {
            var river = new River();
            river.make(objectType.user_resource,query_groups_person,callback);
        }
    ],function(err) {
        callback();
    });
};

/* Prototype remove
 * remove river for indexing users
 * 
 */
User.prototype.remove = function(callback) {
    async.parallel([
        function(callback) {
            var river = new River();
            river.drop(objectType.user,callback);
        },
        function(callback) {
            var river = new River();
            river.drop(objectType.user_access,callback);
        },
        function(callback) {
            var river = new River();
            river.drop(objectType.user_resource,callback);
        }
    ],function(err) {
        callback();
    });
};

/* Prototype getPrivileges
 * Check acess rights of each user
 * 
 */
User.prototype.check = function(login,pass,callback) {
    // get user with same login from 'session'
    async.detect(_users,function(item,callback){
        if (item.login === login) {
            // pro-long session
            _users[_users.indexOf(item)].exp = ((new Date()).valueOf() + config.appSessionLength * 60*1000);
            callback(true);
        }
        else callback(false);
    },function(res) {
        if (res) {
            callback(null,true);
        }
        // if there not such user in session, let's check him
        else {
            getDataByField(objectType.user,'data.user',login,function(usrs){
                // if there are users with such login - check user rights
                if (usrs) {
                    // create user
                    var u = null;
                    async.filter(usrs,function(user,callback){
                        if ((user.salt) && (user.pass)) {
                            var sha512 = crypto.createHash('sha512');
                            sha512.update(pass + user.salt,'utf8');
                            // if pass are equal
                            if (user.pass === sha512.digest('hex')) {
                                if (!u) {
                                    u = {
                                        login : login,
                                        person: user.person,
                                        exp : ((new Date()).valueOf() + config.appSessionLength * 60*1000),
                                        privileges : [],
                                        group : []
                                    }
                                }
                                // check privileges
                                if      (user.privilege.indexOf('View People') === 0) u.privileges.push(objectType.person);
                                else if (user.privilege.indexOf('View Patients') === 0) u.privileges.push(objectType.patient);
                                else if (user.privilege.indexOf('View Providers') === 0) u.privileges.push(objectType.provider);
                                else if (user.privilege.indexOf('View Encounters') === 0) u.privileges.push(objectType.encounter);
                                else if (user.privilege.indexOf('View Orders') === 0) u.privileges.push(objectType.order);
                                else if (user.privilege.indexOf('View Concepts') === 0) u.privileges.push(objectType.concept);
                                else if (user.privilege.indexOf('View Drug Info') === 0) u.privileges.push(objectType.drug);
                                else if (user.privilege.indexOf('View Locations') === 0) u.privileges.push(objectType.location);
                                else if (user.privilege.indexOf('View Observations') === 0) u.privileges.push(objectType.obs);
                                // get person security groups, 
                                if ((u.group.length === 0) && (usrs.indexOf(user) === 0)) {
                                    // get all groups, which person belongs to
                                    getDataByField(objectType.user_access,'data.person',user.person,function(groups){
                                        // if there are such groups, check each group
                                        if (groups) {
                                            if (!groups.length) groups = [groups];
                                            async.eachSeries(groups,function(item,callback){
                                                u.group.push(item.id);
                                                callback();
                                            },function(err){
                                                callback(true);
                                            });
                                        }
                                        else callback(true);
                                    });
                                }
                                else callback(true);
                            }
                            else callback(false);
                        }
                        else callback(false);
                    },function(res) {
                        if ((res) && (res.length > 0)) {
                            if (u) _users.push(u);
                            callback(null,true);
                        }
                        else callback(null,false);
                    });
                }
                else {
                    callback(null,false);
                }
            });
        }
    });
};

/* Prototype getUser
 * get user data from local store, by request authorization data
 *  
 */
User.prototype.getUser = function(request) {
    // get login from request
    var login = new Buffer(request.headers.authorization.substring(5),'base64').toString().split(':')[0];
    for (var i=0;i<_users.length;i++) if (_users[i].login === login) return _users[i];
    // if there ar eno such user return null
    return null;
};
