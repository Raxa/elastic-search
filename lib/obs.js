exports.Obs = Obs;

function Obs(module) {
    
    /*
     * Private fields
     */
    
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    
    /*
     * Public fields
     */
    
    this.type = objectType.obs;
};

Obs.prototype.index = function(callback) {
    // queries for getting data
    var query_obs = "SELECT obs_id,uuid,person_id,concept_id,encounter_id,order_id,obs_datetime,\n\
            value_modifier,accession_number,obs_group_id,value_coded_name_id,comments,location_id,\n\
            voided,value_complex FROM obs";
    var query_tag = "SELECT obs_id,middle_name,given_name,family_name FROM obs,person_name WHERE\n\
            obs.person_id = person_name.person_id";
    // buffers
    var obss,tags;
    // array for BULK
    var commands = [];
    async.series([
        function(callback) {
            // fetch obs
            connection.query(query_obs, function(error, values, fields) {
                if (!error) obss = values;
                callback();
            });
        },
        function(callback) {
            // fetch tags
            connection.query(query_tag, function(error, values, fields) {
                if (!error) tags = values;
                callback();
            });
        }
    ],function(err){
        if (obss) {
            for (var a=0;a<obss.length;a++) {
                var item = obss[a];
                var obs = {
                    id: item.obs_id,
                    type: objectType.obs,
                    tags: [item.uuid],
                    data: {
                        display : 'obs value ' + item.value_complex,
                        uuid: item.uuid,
                        id: item.obs_id,
                        person: item.person_id,
                        encounter : item.encounter_id,
                        concept: item.concept_id,
                        location: item.location_id,
                        order: item.order_id,
                        value: item.value_complex,
                        valueModifier: item.value_modifier,
                        obsDatetime: item.obs_datetime,
                        accessionNumber: item.accession_number,
                        obsGroup: item.obs_group_id,
                        valueCodedName: item.value_coded_name_id,
                        comment: item.comments,
                        voided: item.voided
                    }
                };
                // if there are tags
                if (tags) {
                    // detect tags
                    async.detect(tags,function(item,callback){
                        if (item.obs_id === obs.id) callback(true);
                        else callback(false);
                    },function(result){
                        if (result) {
                            obs.tags.push(result.family_name);
                            obs.tags.push(result.given_name);
                            if (result.middle_name) obs.tags.push(result.middle_name);
                        }
                        // push BULK commands
                        commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                        commands.push(obs);
                    });
                }
                // if there no tags, just add data to index
                else {
                    commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                    commands.push(obs);
                }
            }
            // execute BULK
            searchserver.bulk(commands,{}).on('done',function(done) {
                callback();
            }).exec();
        }
        else callback();
    });
};

Obs.prototype.search = function(data,callback) {
    // prepare uuid for searching
    data = trimUUID(data);
    // prepare query
    var query;
    if (data === '') {
        query = new Query(this.type);
        query.addField('type');
    }
    else {
        query = new Query(data);
        query.addField('tags');
        query.addFilter('type',this.type);
    }
    // get orders by uuid
    getData(query.q, function(value) {
        // if there was no error, and we gat data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            async.each(value.data.hits,function(ob,callback){
                // fetch fields
                async.parallel([
                    function(callback) {
                        // fetch concept
                        if (ob._source.data.concept) {
                            getDataByField(objectType.concept,'id',ob._source.data.concept,function(concept){
                                ob._source.data.concept = concept;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // fetch encounter
                        if (ob._source.data.encounter) {
                            getDataByField(objectType.encounter,'id',ob._source.data.encounter,function(enc){
                                ob._source.data.encounter = enc;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // fetch person
                        if (ob._source.data.person) {
                            getDataByField(objectType.person,'id',ob._source.data.person,function(person){
                                ob._source.data.person = person;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // fetch location
                        if (ob._source.data.location) {
                            getDataByField(objectType.location,'id',ob._source.data.location,function(location){
                                ob._source.data.location = location;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // fetch order
                        if (ob._source.data.order) {
                            getDataByField(objectType.order,'id',ob._source.data.order,function(order){
                                ob._source.data.order = order;
                                callback();
                            });
                        }
                        else callback();
                    }     
                ],function(err){
                    result.push(ob._source.data);
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

