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

Patient.prototype.index = function(callback) {
    // queries for getting data
    var query_patient = "SELECT patient_id,voided FROM patient";
    var query_identifier = "SELECT patient_id,identifier,name,description,format,voided FROM \n\
                patient_identifier,patient_identifier_type WHERE patient_identifier.identifier_type =\n\
                patient_identifier_type.patient_identifier_type_id";
    var query_person = "SELECT person.person_id,uuid,given_name,middle_name,family_name FROM person,person_name\n\
                WHERE person_name.person_id = person.person_id";
    var patients,identifiers,persons;
    // async get data from mysql db
    async.parallel([
        // get persons
        function(callback) {
            connection.query(query_person, function(error, values, fields) {
                if (!error) persons = values;
                callback();
            });
        },
        // get patients
        function(callback) {
            connection.query(query_patient, function(error, values, fields) {
                if (!error) patients = values;
                callback();
            });
        },
        // get identifiers
        function(callback) {
            connection.query(query_identifier, function(error, values, fields) {
                if (!error) identifiers = values;
                callback();
            });
        }
    // callback function
    ],function(err){
        async.each(patients,function(item,callback){
            var patient = {
                id: item.patient_id,
                type: objectType.patient,
                tags : [],
                data: {
                    voided: item.voided,
                    identifiers: [],
                    uuid: {},
                    display : {}
                }
            };
            // fetch fields
            async.parallel([
                // filter persons
                function(callback) {
                    if (persons) 
                        async.detect(persons,function(item,callback){
                            if (item.person_id === patient.id) callback(true);
                            else callback(false);
                        },function(result){
                            if (result) {
                                // set person's field
                                patient.data.uuid = result.uuid;
                                patient.data.display = "patient " + result.display;
                                // fill tags
                                patient.tags.push(result.uuid);
                                patient.tags.push(result.given_name);
                                patient.tags.push(result.middle_name);
                                patient.tags.push(result.family_name);
                            }
                            callback();
                        });
                    else callback();
                },
                // filter identifiers
                function(callback) {
                    async.filter(identifiers,function(item,callback){
                        if (item.person_id === patient.id) callback(true);
                        else callback(false);
                    },function(results){
                        if (results) patient.data.identifiers = results;
                        callback();
                    });
                }
            // callback, when all fields are set
            ],function(err,res) {
                searchserver.index(indexName, indexType, patient).on('data', function(data) {
                    callback();
                }).exec();    
            });
        },function(err,res){
            callback();
        });
    });
};  

Patient.prototype.search = function(data, callback) {
    // get persons according to uuid/name
    var result = {
        result: {},
        data: [],
        id: []
    };
    var query = new Query(data);
    query.addField('tags');
    query.addFilter('type',objectType.person);
    // get all persons
    getData(query.q,function(res) {
        // if there was no error and we get data
        if ((res.result === searchResult.ok) && (res.data.total > 0)){
            // check each person
            async.each(res.data.hits,function(hit,callback){
                // get patient by person id
                getDataByField(objectType.patient,'id',hit._source.id,function(patient){
                    if (patient) {
                        // if there is double-indexed values
                        if (patient.length > 1) {
                            patient[0].person = hit._source.data;
                            result.data.push(patient[0]);
                        }
                        // if there are single result
                        else {
                            patient.person = hit._source.data;
                            result.data.push(patient);
                        }
                        result.id.push(hit._source.id);
                    }
                    callback();
                });
            },function(err,res){
                callback(result);
            });
        } 
        // if we get no data
        else {
            result.result = res.result;
            callback(result);
        }
    });
};

