exports.Patient = Patient;

/* Class Patient
 * adding, removing, searching 'patient'
 * 
 */
function Patient() {
    this.type = objectType.patient;
};

/* Prototype river
 * add river for updating patients
 * 
 */
Patient.prototype.river = function(callback) {
    // get identifiers
    var query_identifier = "SELECT patient_id AS 'patient_id',\n\
                                   CONCAT('patient_identifier',patient_identifier_id) AS '_id',\n\
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
                                   CONCAT('patient',person.person_id) AS '_id',\n\
                                   patient.voided AS 'data.voided',\n\
                                   person.uuid AS 'data.uuid',\n\
                                   given_name AS 'tags.name1',\n\
                                   middle_name AS 'tags.name2',\n\
                                   family_name AS 'tags.name3',\n\
                                   'patient' AS 'type',\n\
                                   person.uuid AS 'tags.uuid',\n\
                                   CONCAT(given_name,\" \",family_name) AS 'data.display' \n\
                              FROM patient,\n\
                                   person,\n\
                                   person_name\n\
                             WHERE person_name.person_id = person.person_id \n\
                               AND patient.patient_id = person.person_id";
    var river = new River();
    async.series([
        function(callback) {
            river.make(objectType.patient,query_patient,callback);
        },
        function(callback) {
            river.make(objectType.patient_identifier,query_identifier,callback);
        }
    ],function(err,res) {
        callback();
    });
};

/* Prototype search
 * 
 * @param {type} data - value for searching
 * @param {type} options - request options
 * @param {type} user - user authorization data
 * @param {type} callback - function for returning data
 * @returns {undefined} 
 */
Patient.prototype.search = function(data, options, user, callback) {
    var query = new Query(this.type);
    // if any options selected
    if ((data) || (options.q)) {
        var key = (data) ? data : options.q;
        if (key !== trimUUID(key)) {
            key = trimUUID(key);
            query.addOption('tags.uuid',key);
        }
        else {
            query.addFuzzyOption('tags.name1',key);
            query.addFuzzyOption('tags.name2',key);
            query.addFuzzyOption('tags.name3',key);
        }
    }
    // get all patients
    getData(query.q,function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each person
            async.each(value.data.hits,function(item,callback){
                    // accept flag
                    var accept = false;
                    // fetch field using async
                    async.parallel([
                        // check access rights to this object
                        function(callback) {
                            getDataByField(objectType.user_resource,'data.person',item._source.id,function(items) {
                                // if there are groups with this person
                                if (items) {
                                    // if it is single object - make an array with this obejct
                                    if (!items.length) items = [items];
                                    async.each(items,function(item,callback){
                                        // if resource group === user group
                                        if (user.group.indexOf(item.id) !== -1) accept = true;
                                        callback();
                                    },function(res){
                                        callback();
                                    });
                                }
                                else callback();
                            });
                        },
                        // prepare 'person'
                        function(callback) {
                            if (!options.quick) {
                                getDataByField(objectType.person,'id',item._source.id,function(pers) {
                                    if ((pers) && (pers.length > 1)) pers = pers[0];
                                    item._source.data.person = pers;
                                    callback();
                                });
                            }
                            else callback();
                        },
                        // prepare 'identifiers'
                        function(callback) {
                            if (!options.quick) {
                                getDataByField(objectType.patient_identifier,'patientid',item._source.id,function(ids) {
                                    item._source.data.identifiers = ids;
                                    callback();
                                });
                            }
                            else callback();
                        }
                    ],function(err,res){
                        // if it is in one security group with this user - add to result data
                        if (accept === true) result.push(item._source.data);
                        callback();
                    });
            },function(err,res){
                callback(result);
            });  
        }
        else {
            if (value.result === searchResult.ok) callback([]);
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
 * remove river for updating patients
 * 
 */
Patient.prototype.remove = function(callback) {
    var river = new River();
    async.series([
        function(callback) {
            river.drop(objectType.patient,callback);
        },
        function(callback) {
            river.drop(objectType.patient_identifier,callback);
        }
    ],function(err,res) {
        callback(err);
    });
};
