exports.Provider = Provider;

function Provider(module) {
    
    /*
     * Private fields
     */
    
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    
    /*
     * Public fields
     */
    
    this.type = objectType.provider;
}

Provider.prototype.index = function(callback) {
    // queries for getting data
    var query_attribute = "SELECT provider_id,value_reference AS valueReference,name,description,datatype FROM \n\
                    provider_attribute,provider_attribute_type WHERE \n\
                    provider_attribute.attribute_type_id = provider_attribute_type.provider_attribute_type_id";
    var query_provider = "SELECT provider_id,person_id,name,identifier,retired,uuid FROM provider";
    // buffers
    var providers,attributes;
    // array for BULK
    var commands = [];
    // async get data from mysql db
    async.series([
        // get providers
        function(callback) {
            connection.query(query_provider, function(error, values, fields) {
                if (!error) providers = values;
                callback();
            });
        },
        // get attributes
        function(callback) {
            connection.query(query_attribute, function(error, values, fields) {
                if (!error) attributes = values;
                callback();
            });
        }
    // callback function
    ],function(err){
        if (providers) {
            for (var a=0;a<providers.length;a++) {
                var item = providers[a];
                var provider = {
                    id: item.provider_id,
                    type: objectType.provider,
                    tags : [item.name,item.uuid],
                    data: {
                        display : "provider name " + item.name,
                        name: item.name,
                        uuid: item.uuid,
                        identifier: item.identifier,
                        retired: item.retired,
                        attributes: [],
                        person: item.person_id
                    }
                };
                // fetch fields
                async.parallel([
                    // filter attributes
                    function(callback) {
                        if (attributes) {
                            async.filter(attributes,function(item,callback){
                                if (item.provider_id === provider.id) callback(true);
                                else callback(false);
                            },function(results){
                                provider.data.attributes = results;
                                callback();
                            });
                        }
                        else callback();
                    }
                // callback, when all fields are set
                ],function(err,res) {
                    // push BULK commands
                    commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                    commands.push(provider);
                });
            }
            // execute BULK
            searchserver.bulk(commands,{}).on('done',function(done) {
                callback();
            }).exec();
        }
        else callback();
    });
};  

Provider.prototype.search = function(data,callback) {
    // prepare query
    var query;
    if (data === '') {
        query = new Query(this.type);
        query.addField('type');
    }
    else {
        query = new Query(data);
        query.addField('tags');
        query.addFilter('type',this.type);
    }
    // get all providers
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            var result = [];
            async.each(value.data.hits,function(provider,callback){
                if (provider) {
                    getDataByField(objectType.person,'id',provider._source.data.person,function(person) {
                        provider._source.data.person = person;
                        result.push(provider._source.data);
                        callback();
                    });
                }
                else callback();
            },function(err,res){
                callback(result);
            });
        }
        else {
            if (value.result === searchResult.ok) 
                callback({
                    error : {
                        message : errorType.no_data
                    }
                });
            else 
            callback({
                'error' : {
                    message : errorType.server
                }
            });
        }
    });
};


