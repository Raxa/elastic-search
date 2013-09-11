exports.Provider = Provider;

/* Class Provider
 * adding, removing, searching providers
 * 
 */
function Provider() {
    this.type = objectType.provider;
}

/* Prototype river
 * add river for updating providers
 * 
 */
Provider.prototype.river = function(callback) {
    // get attributes
    var query_attribute = "SELECT provider_id AS 'provider_id',\n\
                                  CONCAT('provider_attribute',provider_attribute_id) AS '_id',\n\
                                  value_reference AS 'data.valueReference',\n\
                                  name AS 'data.name',\n\
                                  'provider_attribute' AS 'type',\n\
                                  description AS 'data.description',\n\
                                  datatype AS 'data.datatype' \n\
                             FROM provider_attribute,\n\
                                  provider_attribute_type \n\
                            WHERE provider_attribute.attribute_type_id = provider_attribute_type.provider_attribute_type_id";
    // get providers
    var query_provider =  "SELECT provider_id AS 'id',\n\
                                  CONCAT('provider',provider_id) AS '_id',\n\
                                  person_id AS 'data.person',\n\
                                  name AS 'data.name',\n\
                                  'provider' AS 'type',\n\
                                  identifier AS 'data.identifier',\n\
                                  'provider' AS 'data.diplay',\n\
                                  retired AS 'data.retired',\n\
                                  uuid AS 'data.uuid',\n\
                                  uuid AS 'tags.uuid',\n\
                                  name AS 'tags.name' \n\
                             FROM provider";
    var river = new River();
    async.series([
        function(callback) {
            river.make(objectType.provider_attribute,query_attribute,callback);
        },
        function(callback) {
            river.make(objectType.provider,query_provider,callback);
        }
    ],function(err,res) {
        callback();
    });
};  

/* Prototype search
 * 
 * @param {type} data - value for searching
 * @param {type} options - request options
 * @param {type} callback - function for returning data
 * @returns {undefined} 
 */
Provider.prototype.search = function(data, options, callback) {
    var query = new Query(this.type);
    // if any options selected
    if ((data) || (options.q)) {
        var key = (data) ? data : options.q;
        if (key !== trimUUID(key)) {
            key = trimUUID(key);
            query.addOption('tags.uuid',key);
        }
        else query.addFuzzyOption('tags.name',key);
    }
    // get all providers
    getData(query.q,function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each provider
            async.each(value.data.hits,function(item,callback){
                if (!options.quick) {
                    // fetch field using async
                    async.series([
                        // prepare 'person'
                        function(callback) {
                            if (item._source.data.person) {
                                getDataByField(objectType.person,'id',item._source.data.person,function(person){
                                    if ((person) && (person.length > 1)) person = person[0];
                                    item._source.data.person = person;
                                    callback();
                                });
                            }
                            else callback();
                        },
                        // prepare 'attributes'
                        function(callback) {
                            getDataByField(objectType.provider_attribute,'id',item._source.id,function(att){
                                item._source.data.attributes = att;
                                callback();
                            });
                        }
                    ],function(err,res){
                        result.push(item._source.data);
                        callback();
                    });
                }
                else {
                    result.push(item._source.data);
                    callback();
                }
            },function(err,res){
                callback(result);
            });  
        }
        else {
            if (value.result === searchResult.ok) 
                callback([]);
            else {
                callback({
                    'error' : {
                        message : errorType.server
                    }
                });
            }
        }
    });
};

/* Prototype remove
 * remove river for updating providers
 * 
 */
Provider.prototype.remove = function(callback) {
    var river = new River();
    async.series([
        function(callback) {
            river.drop(objectType.provider,callback);
        },
        function(callback) {
            river.drop(objectType.provider_attribute,callback);
        }
    ],function(err,res) {
        callback(err);
    });
};

