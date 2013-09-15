exports.Patientlist = Patientlist;

/* Class Patientlist
 * adding, removing, searching 'drug'
 * 
 */
function Patientlist() {
    this.type = objectType.patientlist;
}

/* Prototype river
 * add river for updating patientlist
 * 
 */
Patientlist.prototype.river = function(callback) {
    // get patients
    var query_pat = "SELECT person.uuid AS 'data.patient.uuid', \n\
                    CONCAT('patientlist',encounter.encounter_id) AS '_id',\n\
                    person.gender AS 'data.patient.gender',\n\
                    person.birthdate AS 'data.patient.birthdate',\n\
                    encounter.encounter_datetime AS 'tags.date',\n\
                    'patientlist' AS 'type',\n\
                    encounter.encounter_datetime AS 'data.encounter.encounterDatetime',\n\
                    encounter_type.name AS 'data.encounter.encounterType',\n\
                    encounter.uuid AS 'data.encounter.uuid',\n\
                    encounter_type.name AS 'tags.type' \n\
               FROM encounter,\n\
                    person,\n\
                    encounter_type \n\
              WHERE encounter.patient_id = person.person_id \n\
                AND person.person_id = encounter.patient_id \n\
                AND encounter.encounter_type = encounter_type.encounter_type_id";
    river = new River();
    async.series([
        function(callback) {
            river.make(objectType.patientlist,query_pat,callback);
        }
    ],function(err,res) {
        callback();
    });
};

/* Prototype search
 * 
 * @param {type} data  -value for searching 
 * @param {type} options - request options
 * @param {type} callback - function for returning data
 * @returns {undefined} 
 */
Patientlist.prototype.search = function(data, options, callback) {
    var query = new Query(this.type);
    // if any options selected
    if (options.encounterType) {
        query.addFilter('tags.type',options.encounterType);
    }
    // get all patients
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            //console.log(JSON.stringify(value));
            // resulting object
            var result = [];
            // id of patients
            var pats = [];
            var indx = [];
            // check each patient
            async.each(value.data.hits,function(item,callback){
                var start, end;
                if (options.startDate) start = new Date(options.startDate);
                else  start = new Date(1);
                if (options.endDate) end = new Date(options.endDate);
                else end = new Date();
                if ((new Date(item._source.data.encounter.encounterDatetime) > start) 
                            && (end > new Date(item._source.data.encounter.encounterDatetime))) {
                        // if there no such patient
                    if (pats.indexOf(item._source.data.patient.uuid) === -1) {
                        pats.push(item._source.data.patient.uuid);
                        var patient = {
                            display : 'patient',
                            uuid : item._source.data.patient.uuid,
                            gender : item._source.data.patient.gender,
                            age : new Date().getFullYear() - new Date(item._source.data.patient.birthdate).getFullYear(),
                            encounters : []
                        };
                        result.push(patient);
                        indx.push(result.indexOf(patient));
                    }
                    var patient_index = indx[pats.indexOf(item._source.data.patient.uuid)];
                    result[patient_index].encounters.push({
                        uuid : item._source.data.encounter.uuid,
                        display : 'encounter',
                        encounterType : item._source.data.encounter.encounterType,
                        encounterDatetime : item._source.data.encounter.encounterDatetime
                    });
                }
                callback();
            },function(err,res){
                callback(result);
            });
        }
        else {
            if (value.result === searchResult.ok) callback([]);
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
 * remove river for patientlist
 * 
 */
Patientlist.prototype.remove = function(callback) {
    var river = new River();
    async.series([
        function(callback) {
            river.drop(objectType.patientlist,callback);
        }
    ],function(err,res) {
        callback(err);
    });
};


