exports.Concept = Concept;

/* Class Concept
 * adding, removing, searching 'concept'
 * 
 */
function Concept() {
    this.type = objectType.concept;
}

/* Prototype river
 * add river for updating concepts
 * 
 */
Concept.prototype.river = function(callback) {
    // get concepts
    var query_concept = "SELECT concept.concept_id AS 'id',\n\
                                concept.uuid AS 'data.uuid',\n\
                                concept.retired AS 'data.retired',\n\
                                short_name AS 'data.shortName',\n\
                                short_name AS 'tags.name',\n\
                                'concept' AS 'data.display',\n\
                                version AS 'data.version',\n\
                                concept.uuid AS 'tags.uuid',\n\
                                concept_class.name AS 'tags.class',\n\
                                concept_datatype.name AS 'data.datatype.name',\n\
                                concept_datatype.description AS 'data.datatype.description',\n\
                                concept_class.name AS 'data.conceptClass.name',\n\
                                concept_class.description AS 'data.conceptClass.description',\n\
                                'concept' AS 'type' \n\
                           FROM concept,\n\
                                concept_class,\n\
                                concept_datatype \n\
                          WHERE concept.class_id = concept_class.concept_class_id \n\
                            AND concept.datatype_id = concept_datatype.concept_datatype_id";
    // get descriptions
    var query_desc =    "SELECT concept_id AS 'id',\n\
                                description AS 'data.description',\n\
                                locale AS 'data.locale',\n\
                                uuid AS 'data.uuid',\n\
                                'concept_description' AS 'type' \n\
                           FROM concept_description";
    // get names
    var query_name =    "SELECT concept_id AS 'id',\n\
                                name AS 'data.name',\n\
                                locale AS 'data.locale', \n\
                                uuid AS 'data.uuid',\n\
                                'concept_name' AS 'type' \n\
                           FROM concept_name";
    // get set
    var query_set =     "SELECT concept_id AS 'id',\n\
                                concept_set AS data.conceptSet',\n\
                                sort_weight AS 'data.sortWeight',\n\
                                uuid AS 'data.uuid',\n\
                                'concept_set' AS 'type' \n\
                           FROM concept_set";
    river = new River();
    async.series([
        function(callback) {
            river.make(objectType.concept,query_concept,callback);
        },
        function(callback) {
            river.make(objectType.concept_desc,query_desc,callback);
        },
        function(callback) {
            river.make(objectType.concept_name,query_name,callback);
        },
        function(callback) {
            river.make(objectType.concept_set,query_set,callback);
        }
        // etc
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
Concept.prototype.search = function(data, options, callback) {
    var query = null;
    // if data selected
    if (data) {
        // if it is UUID
        if (data !== trimUUID(data)) {
            data = trimUUID(data);
            query = new Query(data);
            query.addField('tags.uuid');
        }
        // if it is name
        else {
            query = new Query(tokenizeValue(data));
            query.addField('tags.name');
        }
        if (options.class) query.addFilter('tags.class',options.class);
        query.addFilter('type',this.type);
    }
    else {
        // if only class selected
        if ((!options.q) && (options.class)) {
            query = new Query(options.class);
            query.addField('tags.class');
        }
        // if nothing selected
        else if ((!options.q) && (!options.class)) {
            query = new Query(this.type);
            query.addField('type');
        }
        // if query selected
        else {
            // if this is UUID
            if (options.q !== trimUUID(options.q)) {
                var value = trimUUID(options.q);
                query = new Query(value);
                query.addField('tags.uuid');
            }
            else {
                query = new Query(tokenizeValue(data));
                query.addField('tags.name');
            }
            if (options.class) query.addFilter('tags.class',options.class);
        }
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
                if (!options.quick) {
                    async.parallel([
                        // fetch names
                        function(callback) {
                            if (concept._source.id) {
                                getDataByField(objectType.concept_name,'id',concept._source.id,function(names) {
                                    concept._source.data.names = names;
                                    callback();
                                });
                            }
                            else callback();
                        },
                        // fetch set
                        function(callback) {
                            if (concept._source.id) {
                                getDataByField(objectType.concept_set,'id',concept._source.id,function(set) {
                                    concept._source.data.set = set;
                                    callback();
                                });
                            }
                            else callback();
                        },
                        // fetch descriptions
                        function(callback) {
                            if (concept._source.id) {
                                getDataByField(objectType.concept_desc,'id',concept._source.id,function(descriptions) {
                                    concept._source.data.descriptions = descriptions;
                                    callback();
                                });
                            }
                            else callback();
                        }
                    ],function(err){
                        result.push(concept._source.data);
                        callback();
                    });
                }
                else {
                    result.push(concept._source.data);
                    callback();
                }
            },function(err,res){
                callback(result);
            });
        }
        else {
            if (values.result === searchResult.ok) 
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

/* Prototype remove
 * remove rivers for concepts
 * 
 */
Concept.prototype.remove = function(callback) {
    var river = new River();
    async.series([
        function(callback) {
            river.drop(objectType.concept,callback);
        },
        function(callback) {
            river.drop(objectType.concept_name,callback);
        },
        function(callback) {
            river.drop(objectType.concept_desc,callback);
        },
        function(callback) {
            river.drop(objectType.concept_set,callback);
        }
    ],function(err,res) {
        callback(err);
    });
};