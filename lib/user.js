exports.User = User;

/* Class User
 * Checking user privileges
 * 
 * 
 */
function User(module) {
    
}

/* Prototype river
 * add river for indexing users
 * 
 */
User.prototype.river = function(callback) {
    var query_user = "SELECT username,\n\
                             password,\n\
                             salt,\n\
                             user_role.role,\n\
                             role_privilege.privilege \n\
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
User.prototype.getPrivileges = function(login,pass,callback) {
    // 
};

