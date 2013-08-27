exports.Encounter = Encounter;

/* Class Encounter
 * adding, removing, searching 'encounter'
 * 
 */
function Encounter() {
    this.type = objectType.encounter;
}

/* Prototype river
 * add river for updating encounters
 * 
 */
Encounter.prototype.river = function(callback) {
    // get encounters
    var query_encounter = "SELECT encounter.encounter_id AS 'id',\n\
                                  patient_id AS 'data.patient',\n\
                                  location_id AS 'data.location',\n\
                                  form_id AS 'data.form', 'encounter' AS 'type',\n\
                                  encounter_datetime AS 'data.encounterDatetime',\n\
                                  provider_id AS 'data.provider',\n\
                                  visit_id AS 'data.visit',\n\
                                  encounter.voided AS 'data.voided',\n\
                                  encounter.uuid AS 'data.uuid',\n\
                                  encounter_type.name AS 'data.encounterType.name',\n\
                                  encounter_type.description AS 'data.encounterType.description',\n\
                                  given_name AS 'tags.name1',\n\
                                  family_name AS 'tags.name2',\n\
                                  middle_name AS 'tags.name3',\n\
                                  encounter.uuid AS 'tags.uuid',\n\
                                  'encounter' AS 'data.display' \n\
                             FROM encounter_type,person_name,encounter \n\
                        LEFT JOIN encounter_provider \n\
                               ON encounter.encounter_id = encounter_provider.encounter_id\n\
                            WHERE encounter_type.encounter_type_id = encounter.encounter_type \n\
                              AND person_name.person_id = encounter.patient_id";
    // get forms
    var query_form =      "SELECT form_id AS 'id',\n\
                                  'form' AS 'type',\n\
                                  name AS 'data.name',\n\
                                  description AS 'data.description' \n\
                             FROM form";
    var river = new River();
    async.series([
        function(callback) {
            river.make(objectType.encounter,query_encounter,callback);
        },
        function(callback) {
            river.make(objectType.form,query_form,callback);
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
Encounter.prototype.search = function(data, options, user, callback) {
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
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each encounter
            async.each(value.data.hits,function(enc,callback){
                var accept = false;
                // fetch fields for each encounter
                async.parallel([
                    // check access rights to this object
                    function(callback) {
                        getDataByField(objectType.user_resource,'data.person',enc._source.data.patient,function(items) {
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
                    function(callback) {
                        // get form
                        if ((!options.quick) && (enc._source.data.form)) {
                            getDataByField(objectType.form,'id',enc._source.data.form,function(form){
                                enc._source.data.form = form;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // get location
                        if ((!options.quick) && (enc._source.data.location)) {
                            getDataByField(objectType.location,'id',enc._source.data.location,function(location){
                                enc._source.data.location = location;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // get provider
                        if ((!options.quick) && (enc._source.data.provider)) {
                            getDataByField(objectType.provider,'id',enc._source.data.provider,function(provider){
                                enc._source.data.provider = provider;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        if (!options.quick) {
                            // get obs
                            getDataByField(objectType.obs,'encounter',enc._source.id,function(obs){
                                enc._source.data.obs = obs;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        if (!options.quick) {
                            // get order
                            getDataByField(objectType.order,'encounter',enc._source.id,function(order){
                                enc._source.data.order = order;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // get patient
                        if ((!options.quick) && (enc._source.data.patient)) {
                            getDataByField(objectType.patient,'id',enc._source.data.patient,function(patient){
                                enc._source.data.patient = patient;
                                callback();
                            });
                        }
                        else callback();
                    }
                // callback for each.item.item
                ],function(err,res){
                    // prepare result
                    if (accept === true) result.push(enc._source.data);
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

/* Prototype remove
 * remove river for updating encounters
 *  
 */
Encounter.prototype.remove = function(callback) {
    var river = new River();
    async.series([
        function(callback) {
            river.drop(objectType.encounter,callback);
        },
        function(callback) {
            river.drop(objectType.form,callback);
        }
        // etc
    ],function(err,res) {
        callback(err);
    });
};
