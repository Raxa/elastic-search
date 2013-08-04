exports.Patient = Patient;

function Patient(module) {
    
    /*
     * Private fields
     */
    
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    
    /*
     * Public fields
     */
    
    this.type = objectType.patient;
};

Patient.prototype.search = function(data, callback) {
    // trim uuid value
    data = trimUUID(data);
    // prepare query
    var query;
    // prepare query for search persons
    if (data === '') {
        query = new Query(this.type);
        query.addField('type');
    }
    else {
        query = new Query(data);
        query.addField('tags.uuid');
        query.addField('tags.name1');
        query.addField('tags.name2');
        query.addField('tags.name3');
        query.addFilter('type',this.type);
    }
    // get all patients
    getData(query.q,function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each person
            async.each(value.data.hits,function(item,callback){
                item._source.data.person = {};
                // fetch field using async
                async.series([
                    // prepare 'person'
                    function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','person');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data.person = res.data.hits[0]._source.data;
                                callback();
                            }
                            else {
                                callback();
                            }
                        });
                    },
                    // prepare 'person.preferredName'
                  /*  function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','person_name');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data.person.preferredName = res.data.hits[0]._source.data;
                                callback();
                            }
                            else {
                                item._source.data.person.preferredName = null;
                                callback();
                            }
                        });
                    },
                    // prepare 'person.preferredAddress'
                /*    function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','person_address');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data.person.preferredAddress = res.data.hits[0]._source.data;
                                callback();
                            }
                            else {
                                item._source.data.person.preferredAddress = null;
                                callback();
                            }
                        });
                    },
                    // prepare 'person.attributes'
                    function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','person_attribute');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data.person['attributes'] = [];
                                async.each(res.data.hits,function(i,callback){
                                    item._source.data.person.attributes.push(i._source.data);
                                    callback();
                                },function(err,res){
                                    callback();
                                });
                            }
                            else {
                                item._source.data.person.attributes = null;
                                callback();
                            }
                        });
                    }, */
                    // prepare 'identifiers'
                    function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','patient_identifier');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data['identifiers'] = [];
                                async.each(res.data.hits,function(i,callback){
                                    item._source.data.identifiers.push(i._source.data);
                                    callback();
                                },function(err,res){
                                    callback();
                                })
                            }
                            else {
                                item._source.data['identifiers'] = null;
                                callback();
                            }
                        });
                    }
                ],function(err,res){
                    result.push(item._source.data);
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

Patient.prototype.river = function(callback) {
    var query_identifier = "SELECT patient_id AS 'id', identifier AS 'data.identifier', name AS 'data.name', \n\
                description AS 'data.description', format AS 'data.format', voided AS 'data.voided',\n\
                'patient_identifier' AS 'type' FROM \n\
                patient_identifier,patient_identifier_type WHERE patient_identifier.identifier_type =\n\
                patient_identifier_type.patient_identifier_type_id";
    var query_patient = "SELECT person.person_id AS 'id', patient.voided AS 'data.voided', person.uuid AS 'data.uuid', \n\
                given_name AS 'tags.name1', middle_name AS 'tags.name2', family_name AS 'tags.name3','patient' AS 'type', \n\
                person.uuid AS 'tags.uuid' FROM patient,person,person_name\n\
                WHERE person_name.person_id = person.person_id AND patient.patient_id = person.person_id";
    river = new River(module);
    async.series([
        function(callback) {
            river.make('patient',query_patient,callback);
        },
        function(callback) {
            river.make('patient_identifier',query_identifier,callback);
        }
        // etc
    ],function(err,res) {
        callback();
    });
};

Patient.prototype.remove = function(callback) {
    river = new River(module);
    async.series([
        function(callback) {
            river.drop('patient',callback);
        },
        function(callback) {
            river.drop('patient_identifier',callback);
        }
        // etc
    ],function(err,res) {
        callback(err);
    });
};
