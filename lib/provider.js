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
        async.each(providers,function(item,callback){
            var provider = {
                id: item.provider_id,
                type: objectType.provider,
                tags : [item.name,item.uuid],
                data: {
                    display : "provider " + item.name,
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
                    async.filter(attributes,function(item,callback){
                        if (item.provider_id === provider.id) callback(true);
                        else callback(false);
                    },function(results){
                        if (results.length > 0) provider.data.attributes = results;
                        callback();
                    });
                }
            // callback, when all fields are set
            ],function(err,res) {
                // push BULK commands
                commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                commands.push(provider);
                callback();
            });
        },function(err,res){
            // execute BULK
            searchserver.bulk(commands,{}).exec();
            commands = null;
            callback();
        });
    });
};  

Provider.prototype.search = function(data,callback) {
    // trim uuid value
    var result = {
        result: {},
        data: [],
        id: []
    };
    var query = new Query(data);
    query.addField('uuid');
    query.addField('data.name');
    query.addFilter('type',objectType.provider);
    // get all providers
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            async.each(value.data.hits,function(provider,callback){
                if (provider) {
                    getDataByField(objectType.person,'id',provider._source.data.person,function(person) {
                        provider._source.data.person = person;
                        result.data.push(provider._source.data);
                        result.id.push(provider._source.id);
                        callback();
                    });
                }
                else callback();
            },function(err,res){
                result.result = value.result;
                callback(result);
            });
        }
        else {
            result.result = value.result;
            callback(result);
        }
    });
};


