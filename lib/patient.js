exports.Patient = Patient;

/* Class Patient
 *  
 * 
 */
function Patient(module) {
    // import functions
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    // set type
    this.type = objectType.patient;
};

/* Prototype search
 * 
 * 
 */
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
                // fetch field using async
                async.series([
                    // prepare 'person'
                    function(callback) {
                        getDataByField(objectType.person,'id',item._source.id,function(pers) {
                            if ((pers) && (pers.length > 1)) pers = pers[0];
                            item._source.data.person = pers;
                            callback();
                        });
                    },
                    // prepare 'identifiers'
                    function(callback) {
                        getDataByField(objectType.patient_identifier,'id',item._source.id,function(ids) {
                            item._source.data.identifiers = ids;
                            callback();
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

/* Prototype river
 * 
 * 
 */
Patient.prototype.river = function(callback) {
    // get identifiers
    var query_identifier = "SELECT patient_id AS 'id',\n\
                                   identifier AS 'data.identifier',\n\
                                   name AS 'data.name',\n\
                                   description AS 'data.description',\n\
                                   format AS 'data.format',\n\
                                   voided AS 'data.voided',\n\
                                   'patient_identifier' AS 'type' \n\
                              FROM patient_identifier,\n\
                                   patient_identifier_type \n\
                             WHERE patient_identifier.identifier_type = patient_identifier_type.patient_identifier_type_id";
    // get patients
    var query_patient =    "SELECT person.person_id AS 'id',\n\
                                   patient.voided AS 'data.voided',\n\
                                   person.uuid AS 'data.uuid',\n\
                                   given_name AS 'tags.name1',\n\
                                   middle_name AS 'tags.name2',\n\
                                   family_name AS 'tags.name3',\n\
                                   'patient' AS 'type',\n\
                                   person.uuid AS 'tags.uuid',\n\
                                   'patient' AS 'data.display' \n\
                              FROM patient,\n\
                                   person,\n\
                                   person_name\n\
                             WHERE person_name.person_id = person.person_id \n\
                               AND patient.patient_id = person.person_id";
    river = new River(module);
    async.series([
        function(callback) {
            river.make(objectType.patient,query_patient,callback);
        },
        function(callback) {
            river.make(objectType.patient_identifier,query_identifier,callback);
        }
        // etc
    ],function(err,res) {
        callback();
    });
};

/* Prototype remove
 * 
 * 
 */
Patient.prototype.remove = function(callback) {
    river = new River(module);
    async.series([
        function(callback) {
            river.drop(objectType.patient,callback);
        },
        function(callback) {
            river.drop(objectType.patient_identifier,callback);
        }
        // etc
    ],function(err,res) {
        callback(err);
    });
};
