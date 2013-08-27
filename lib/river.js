exports.River = River;

/* Class River
 * creating/removing rivers for fetching data from MySQL
 * 
 */
function River() {
    
}

/* Prototype make
 * create river with specified params
 * 
 */
River.prototype.make = function(name,sql,callback) {
    request({
        uri: 'http://' + config.esHost + ':' + config.esPort + '/_river/' + name + '/_meta',
        method : 'PUT',
        json: {
            "type" : "jdbc",
            "jdbc" : {
                "driver" : "com.mysql.jdbc.Driver",
                "url" : "jdbc:mysql://" + config.dbHost + ":3306/" + config.dbName,
                "user" : config.dbUser,
                "password" : config.dbPass,
                "sql" : sql,
                "fetchsize" : config.appMaxBulkFetchSize,
                "bulksize" : config.appMaxBulkSize,
                "max_bulk_requests" : config.appMaxBulkReq,
                "strategy" : "simple"
            },
            "index" : {
                "index" : indexName,
                "type" : indexType
            }
        }
    },function(err,resp,body){
        callback();
    });
};

/* Prototype drop
 * delete river by river name
 *  
 */
River.prototype.drop = function(name,callback) {
    request({
        uri: 'http://' + config.esHost + ':' + config.esPort + '/_river/' + name,
        method : 'DELETE'
    },function(err,res,body){
        callback();
    });
};


