exports.SearchServer = SearchServer;

function SearchServer(module) {
    
    /*
     * Private fields
     */
    
    entities = [];
}

/* Search for values in search server
 * 
 * @param {type} data - data
 * @param {type} callback
 */

SearchServer.prototype.search = function(type,entity,data,callback) {
    if (type === searchType.single) {
        // get the object for searching
        async.detect(entities,function(item,callback){
            if (item.type === entity) callback(true);
            else callback(false);
        // call object.search() function
        },function(result){
            if (result)
                result.search(data,callback);
            else {
                callback({
                    result : searchResult.error,
                    data : errorType.incorr_data
                });
            }
        });
    }
};

/* Index entities, added to layer
 * 
 * @param {type} callback
 */
SearchServer.prototype.index = function(callback) {
    async.eachSeries(entities,function(item,callback){
        var name = 'index' + item.type;
        if (config.get(name) !== true ) {
            console.log('indexing ' + item.type);
            item.index(function (){
                config.set(name,true);
                callback();
            });
        }
        else callback();
    },function(err,res){
        callback();
    });
};

/* Add entity to search layer (such as patient,encounter,etc)
 * 
 * @param {type} entity - entity, which will be added
 */
SearchServer.prototype.addEntity = function(entity) {
    entities.push(entity);
};

/* Check if this type is added to search layer
 * 
 * @param {type} type - type for checking
 * @param {type} callback - function callback
 */
SearchServer.prototype.isRegisteredType = function(type,callback) {
    async.detect(entities,function(item,callback){
        if (item.type === type) callback(true);
        else callback(false);
    },function(result){
        if (result) callback(true);
        else callback(false);
    });
};

SearchServer.prototype.clean = function(callback) {
    var commands = [];
    commands.push({
        "delete" : {
            "_index" : indexName,
            "_type" : indexType
        }
    });
    searchserver.bulk(commands,{}).exec();
    callback();
};