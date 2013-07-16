exports.SearchServer = SearchServer;

function SearchServer(module) {
    
    /*
     * Private fields
     */
    
    searchType = module.searchType;
    searchResult = module.searchResult;
    errorType = module.errorType;
    async = module.async;
    // array of entities
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
            if (result) result.search(data,callback);
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
        item.index(callback);
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