exports.Obs = Obs;

/* Class Obs
 * adding, removing, searching 'obs'
 * 
 */
function Obs() {
    this.type = objectType.obs;
};

/* Prototype river
 * add river for updating obs
 * 
 */
Obs.prototype.river = function(callback) {
    // queries for getting data
    var query_obs = "SELECT obs_id AS 'id',\n\
                            obs.uuid AS 'data.uuid',\n\
                            obs.person_id AS 'data.person',\n\
                            concept_id AS 'data.concept',\n\
                            'obs' AS 'data.display',\n\
                            encounter_id AS 'data.encounter',\n\
                            order_id AS 'data.order',\n\
                            obs_datetime AS 'data.obsDatetime',\n\
                            value_modifier AS 'data.valueModifier',\n\
                            accession_number AS 'data.accessionNumber',\n\
                            'obs' AS 'type',\n\
                            obs_group_id AS 'data.obsGroup',\n\
                            value_coded_name_id AS 'data.valueCodedName',\n\
                            comments AS 'data.comments',\n\
                            location_id AS 'data.location',\n\
                            obs.voided AS 'data.voided',\n\
                            value_complex AS 'data.value', \n\
                            obs.uuid AS 'tags.uuid',\n\
                            middle_name AS 'tags.name1',\n\
                            given_name AS 'tags.name2',\n\
                            family_name AS 'tags.name3' \n\
                       FROM obs,\n\
                            person_name \n\
                      WHERE obs.person_id = person_name.person_id";
    var river = new River();
    async.series([
        function(callback) {
            river.make(objectType.obs, query_obs, callback);
        }
    ], function(err, res) {
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
Obs.prototype.search = function(data, options, user, callback) {
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
    // get orders by uuid
    getData(query.q, function(value) {
        // if there was no error, and we gat data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            async.each(value.data.hits, function(ob, callback) {
                var accept = false;
                // fetch fields
                async.parallel([
                    // check access rights to this object
                    function(callback) {
                        getDataByField(objectType.user_resource,'data.person',ob._source.data.person,function(items) {
                            // if there are groups with this person
                            if (items) {
                                // if it is single object - make an array with this obejct
                                if (!items.length) items = [items];
                                async.each(items,function(item,callback){
                                    // if resource group === user group
                                    if (user.group.indexOf(item.id) !== -1) {
                                        accept = true;
                                    }
                                    callback();
                                },function(res){
                                    callback();
                                });
                            }
                            else callback();
                        });
                    },
                    function(callback) {
                        // fetch concept
                        if ((!options.quick) && (ob._source.data.concept)) {
                            getDataByField(objectType.concept, 'id', ob._source.data.concept, function(concept) {
                                if ((concept) && (concept.length > 1)) concept = concept[0];
                                ob._source.data.concept = concept;
                                callback();
                            });
                        } else callback();
                    }, 
                    function(callback) {
                        // fetch encounter
                        if ((!options.quick) && (ob._source.data.encounter)) {
                            getDataByField(objectType.encounter, 'id', ob._source.data.encounter, function(enc) {
                                if ((enc) && (enc.length > 1)) enc = enc[0];
                                ob._source.data.encounter = enc;
                                callback();
                            });
                        } else callback();
                    }, 
                    function(callback) {
                        // fetch person
                        if ((!options.quick) && (ob._source.data.person)) {
                            getDataByField(objectType.person, 'id', ob._source.data.person, function(person) {
                                if ((person) && (person.length > 1)) person = person[0];
                                ob._source.data.person = person;
                                callback();
                            });
                        } else callback();
                    }, 
                    function(callback) {
                        // fetch location
                        if ((!options.quick) && (ob._source.data.location)) {
                            getDataByField(objectType.location, 'id', ob._source.data.location, function(location) {
                                if ((location) && (location.length > 1)) location = location[0];
                                ob._source.data.location = location;
                                callback();
                            });
                        } else callback();
                    }, 
                    function(callback) {
                        // fetch order
                        if ((!options.quick) && (ob._source.data.order)) {
                            getDataByField(objectType.order, 'id', ob._source.data.order, function(order) {
                                if ((order) && (order.length > 1)) order = order[0];
                                ob._source.data.order = order;
                                callback();
                            });
                        } else callback();
                    }],
                function(err) {
                    if (accept === true) result.push(ob._source.data);
                    callback();
                });
            }, function(err, res) {
                callback(result);
            });
        } else {
            if (value.result === searchResult.ok) callback({
                error: {
                    message: errorType.no_data
                }
            });
            else callback({
                'error': {
                    message: errorType.server
                }
            });
        }
    });
};

/* Prototype remove
 * remove river for updating obs
 * 
 */
Obs.prototype.remove = function(callback) {
    var river = new River();
    async.series([
        function(callback) {
            river.drop(objectType.obs, callback);
        }
    ], function(err, res) {
        callback(err);
    });
};