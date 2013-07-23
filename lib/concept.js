exports.Concept = Concept;

function Concept(module) {
    
    /*
     * Private fields
     */
    
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    
    /*
     * Public fields
     */
    
    this.type = objectType.concept;
}

Concept.prototype.index = function(callback) {
    // queries for getting data
    var query_concept = "SELECT concept_id,uuid,retired,short_name,version,datatype_id,class_id FROM concept";
    var query_datatype = "SELECT concept_datatype_id AS id,name,description FROM concept_datatype";
    var query_class = "SELECT concept_class_id AS id,name,description FROM concept_class";
    // buuffers 
    var concepts,types,classes;
    // array for BULK 
    var commands = [];
    // async get data from mysql db
    async.series([
        // get concepts
        function(callback) {
            connection.query(query_concept, function(error, values, fields) {
                if (!error) concepts = values;
                callback();
            });
        },
        // get types
        function(callback) {
            connection.query(query_datatype, function(error, values, fields) {
                if (!error) types = values;
                callback();
            });
        },
        // get classes
        function(callback) {
            connection.query(query_class, function(error, values, fields) {
                if (!error) classes = values;
                callback();
            });
        }
    // limit - 1 process
    ],
    function(err){
        for (var a=0;a<concepts.length;a++) {
            var item = concepts[a];
            var concept = {
                id: item.concept_id,
                type: objectType.concept,
                tags : [item.uuid,item.short_name],
                data: {
                    uuid: item.uuid,
                    display : 'concept ' + item.short_name,
                    name: item.short_name,
                    retired: item.retired,
                    version: item.version,
                    conceptClass: {},
                    datatype: {}
                }
            };
            // fetch fields
            async.series([
                // filter class
                function(callback) {
                    async.detect(classes,function(c,callback){
                        if (c.id === item.class_id) callback(true);
                        else callback(false);
                    },function(result){
                        concept.data.conceptClass = result;
                        if (result) concept.tags.push(result.name);
                        callback();
                    });
                },
                // filter type
                function(callback) {
                    async.detect(types,function(type,callback){
                        if (type.id === item.datatype_id) callback(true);
                        else callback(false);
                    },function(result){
                        concept.data.datatype = result;
                        callback();
                    });
                }
            // callback, when all fields are set
            ],function(err,res) {
                // push BULK commands
                commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                commands.push(concept); 
            });
        }
        searchserver.bulk(commands,{}).on('data',function(data) {
            callback();
        }).exec();
    });
};

Concept.prototype.search = function(data,callback) {
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
    // get concepts
    getData(query.q, function(values) {
        // if there is no error, and we get data
        if ((values.result === searchResult.ok) && (values.data.total > 0)) {
            // prepare resulting object 
            var result = [];
            // check each concept
            async.eachSeries(values.data.hits,function(concept,callback){
                async.parallel([
                    // fetch names
                    function(callback) {
                        getDataByField(objectType.concept_name,'id',2,function(names) {
                            concept._source.data.names = names;
                            callback();
                        });
                    },
                    // fetch set
                    function(callback) {
                        getDataByField(objectType.concept_set,'id',concept._source.id,function(set) {
                            concept._source.data.set = set;
                            callback();
                        });
                    },
                    // fetch descriptions
                    function(callback) {
                        getDataByField(objectType.concept_description,'id',concept._source.id,function(descriptions) {
                            concept._source.data.descriptions = descriptions;
                            callback();
                        });
                    }  
                ],function(err){
                    result.push(concept._source.data);
                    callback();
                });
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