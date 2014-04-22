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
    var query_pat = "SELECT person.uuid AS 'data.patient_uuid', \n\
                    CONCAT('patientlist',encounter.encounter_id) AS '_id',\n\
                    encounter.encounter_id AS 'id',\n\
                    person.gender AS 'data.patient_gender',\n\
                    person.birthdate AS 'data.patient_birthdate',\n\
                    encounter.encounter_datetime AS 'tags.date',\n\
                    'patientlist' AS 'type',\n\
                    person.person_id AS 'tags.person',\n\
                    encounter.encounter_datetime AS 'data.encounter_encounterDatetime',\n\
                    encounter_type.name AS 'data.encounter_encounterType',\n\
                    encounter.uuid AS 'data.encounter_uuid',\n\
                    encounter_type.name AS 'tags.type',\n\
                    CONCAT(given_name,\" \",family_name) AS 'data.display', \n\
                    location.name AS 'tags.location' \n\
               FROM encounter_type,\n\
                    person,\n\
                    person_name,\n\
                    encounter\n\
          LEFT JOIN location \n\
                 ON location.location_id = encounter.location_id \n\
              WHERE encounter.patient_id = person.person_id \n\
                AND person.person_id = encounter.patient_id \n\
                AND person_name.person_id = person.person_id \n\
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
Patientlist.prototype.search = function(data, options, user, callback) {
    var query = new Query(this.type);
    // if any options selected
    if (options.encounterType) query.addFilter('tags.type',options.encounterType);
    if (options.location) query.addFilter('tags.location',options.location);
    // get all patients
    getData(query.q, function(value) {
       // console.log(JSON.stringify(value));
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = {
                uuid : 'null',
                name : 'null',
                description : 'null',
                patients : []
            };
            // id of patients
            var pats = [];
            // check each patient
            async.eachSeries(value.data.hits,function(item,callback){
                //encounter
                var encounter;
                var obs;
                // accept flag
                var accept = false;
                async.parallel([
                    // check assess
                    function(callback) {
                        getDataByField(objectType.user_resource,'data.person',item._source.tags.person,function(items) {
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
                    // check fields
                    function(callback) {
                        var start, end;
                        if (options.startDate) start = new Date(options.startDate);
                        else  start = new Date(1);
                        if (options.endDate) end = new Date(options.endDate);
                        else end = new Date();
                        // check date
                        if ((new Date(item._source.data.encounter_encounterDatetime) > start) 
                        && (end > new Date(item._source.data.encounter_encounterDatetime))) {
                            encounter = {
                                uuid : item._source.data.encounter_uuid,
                                display : 'encounter ' + item._source.data.encounter_encounterType,
                                encounterType : item._source.data.encounter_encounterType,
                                encounterDatetime : item._source.data.encounter_encounterDatetime
                            };
                         }
                         callback();
                    },
                    // get obs
                    function(callback) {
                        if ( 'false' !== options.obs) {
                            getDataByField(objectType.obs,'data.encounter',item._source.id,function(rss) {
                                obs = rss;
                                callback();
                            });
                        }
                        else callback();
                    }
                ],function(err,res){
                    if (accept === true) {
                        var pat_index = pats.indexOf(item._source.data.patient_uuid);
                        if (pat_index === -1) {
                            var patient = {
                                    display : item._source.data.display,
                                    uuid : item._source.data.patient_uuid,
                                    gender : item._source.data.patient_gender,
                                    age : new Date().getFullYear() - new Date(item._source.data.patient_birthdate).getFullYear(),
                                    encounters : []
                            };
                            result.patients.push(patient);
                            pats.push(item._source.data.patient_uuid);
                            pat_index = pats.indexOf(item._source.data.patient_uuid);
                        }
                        if (encounter) { 
                            if (obs) encounter.obs = obs;
                            result.patients[pat_index].encounters.push(encounter);
                        }
                    }
                    callback();
                });
            },function(err) {
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


