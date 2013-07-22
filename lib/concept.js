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
    var query_name = "SELECT concept_id,name,locale,uuid FROM concept_name";
    var query_set = "SELECT concept_id,concept_set AS conceptSet,sort_weight AS sortWeight,uuid FROM concept_set";
    var query_desc = "SELECT concept_id,description,locale,uuid FROM concept_description";
    var query_concept = "SELECT concept_id,uuid,retired,short_name,version,datatype_id,class_id FROM concept";
    var query_datatype = "SELECT concept_datatype_id AS id,name,description FROM concept_datatype";
    var query_class = "SELECT concept_class_id AS id,name,description FROM concept_class";
    // buuffers 
    var concepts,types,classes;
    // array for BULK 
    var commands = [];
    // async get data from mysql db
    async.series([
        // get names
        function(callback) {
            connection.query(query_name, function(error, values, fields) {
                if (!error) {
                    async.each(values,function(item,callback){
                        var name = {
                            id : item.concept_id,
                            type : objectType.concept_name,
                            data : {
                                name : item.name,
                                locale : item.locale,
                                uuid : item.uuid
                            }
                        };
                        // push BULK commands
                        commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                        commands.push(name);
                        callback();
                    },function(err,res) {
                        callback();
                    });
                }
                else callback();
            });
        },
        // get sets
        function(callback) {
            connection.query(query_set, function(error, values, fields) {
                if (!error) {
                    async.each(values,function(item,callback){
                        var set = {
                            id : item.concept_id,
                            type : objectType.concept_set,
                            data : {
                                conceptSet : item.conceptSet,
                                sortWeight : item.sortWeight,
                                uuid : item.uuid
                            }
                        };
                        // push BULK commands
                        commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                        commands.push(set);
                        callback();
                    },function(err,res){
                        callback();
                    });
                }
                else callback();
            });
        },
        // get descs
        function(callback) {
            connection.query(query_desc, function(error, values, fields) {
                if (!error) {
                    async.each(values,function(item,callback){
                        var desc = {
                            id : item.concept_id,
                            type : objectType.concept_description,
                            data : {
                                description : item.description,
                                locale : item.locale,
                                uuid : item.uuid
                            }
                        };
                        // push BULK commands
                        commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                        commands.push(desc);
                        callback();
                    },function(err,res){
                        callback();
                    });
                }
                else callback();
            });
        },
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
        async.each(concepts,function(item,callback){
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
                callback();
            });
        },function(err,res){
            searchserver.bulk(commands,{}).exec();
            commands = null;
            concepts = null;
            types = null;
            classes = null;
            callback();
        });
    });
};

Concept.prototype.search = function(data,callback) {
    var result = {
        result : {},
        data: [],
        id: []
    };
    var query = new Query(data);
    query.addField('tags');
    query.addFilter('type',objectType.concept);
    // get concepts
    getData(query.q, function(values) {
        // if there is no error, and we get data
        if ((values.result === searchResult.ok) && (values.data.total > 0)) {
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
                    result.data.push(concept._source.data);
                    result.id.push(concept._source.id);
                    callback();
                });
            },function(err,res){
                result.result = values.result;
                callback(result);
            });
        }
        else {
            result.result = values.result;
            callback(result);
        }
    });
};