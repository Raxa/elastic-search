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
    var query = null;
    // if data is set, or query set
    if ((data) || ((!data) && (options.q))) {
        var searchvalue = (data) ? data : options.q;
        // check if it is UUID
        if (searchvalue !== trimUUID(searchvalue)) {
            // trim it
            searchvalue = trimUUID(searchvalue);
            // create new query for uuid
            query = new Query(searchvalue);
            query.addField('tags.uuid');
        }
        // if it is not UUID
        else {
            // create query for name
            query = new Query(searchvalue);
            query.addField('tags.name1');
            query.addField('tags.name2');
            query.addField('tags.name3');
        }
        //filter only data with this type
        query.addFilter('type',this.type);
    }
    // if we need to get all values
    else {
        query = new Query(this.type);
        query.addField('type');
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
                                getDataByField(objectType.patient_identifier,'id',item._source.id,function(ids) {
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
