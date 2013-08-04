exports.River = River;

var request = require('request');

function River(module) {
    
}

River.prototype.make = function(name,sql,callback) {
    request({
        uri: 'http://' + config.esHost + ':' + config.esPort + '/_river/' + name + '/_meta',
        method : 'PUT',
        json: {
            "type" : "jdbc",
            "jdbc" : {
                "driver" : "com.mysql.jdbc.Driver",
                "url" : "jdbc:mysql://localhost:3306/openmrs",
                "user" : config.dbUser,
                "password" : config.dbPass,
                "sql" : sql,
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

River.prototype.drop = function(name,callback) {
    request({
        uri: 'http://' + config.esHost + ':' + config.esPort + '/_river/' + name,
        method : 'DELETE'
    },function(err,res,body){
        callback();
    });
};


