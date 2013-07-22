exports.Encounter = Encounter;

function Encounter(module) {
    
    /*
     * Private fields
     */
    
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    
    /*
     * Public fields
     */
    
    this.type = objectType.encounter;
}

Encounter.prototype.index = function(callback) {
    // queries for getting data
    var query_encounters = "SELECT encounter.encounter_id,encounter_type,patient_id,location_id,form_id,\n\
                        encounter_datetime,provider_id,visit_id,encounter.voided,encounter.uuid\n\
                        FROM encounter,encounter_provider WHERE\n\
                        encounter.encounter_id = encounter_provider.encounter_id";
    var query_type = "SELECT encounter_type_id AS id,name,description FROM encounter_type";
    var query_form = "SELECT form_id,name,description FROM form";
    var query_tag = "SELECT encounter_id,middle_name,given_name,family_name FROM person_name,encounter\n\
                        WHERE person_name.person_id = encounter.patient_id";
    // buffers
    var encounters,types,forms,tags;
    // array for BULK
    var commands = [];
    // async get data from mysql db
    async.series([
        // get encounters
        function(callback) {
            connection.query(query_encounters, function(error, values, fields) {
                if (!error) encounters = values;
                callback();
            });
        },
        // get types
        function(callback) {
            connection.query(query_type, function(error, values, fields) {
                if (!error) types = values;
                callback();
            });
        },
        // get forms
        function(callback) {
            connection.query(query_form, function(error, values, fields) {
                if (!error) forms = values;
                callback();
            });
        },
        // get search tags
        function(callback) {
            connection.query(query_tag, function(error, values, fields) {
                if (!error) tags = values;
                callback();
            });
        }
    // callback function
    ],function(err){
        async.each(encounters,function(item,callback){
            var encounter = {
                id: item.encounter_id,
                type: objectType.encounter,
                tags : [item.uuid],
                data: {
                    display : 'encounter ' + item.encounter_datetime,
                    uuid : item.uuid,
                    patient: item.patient_id,
                    location: item.location_id,
                    encounterDatetime: item.encounter_datetime,
                    provider: item.provider_id,
                    voided: item.voided,
                    encounterType: {},
                    form: {}
                }
            };
            // fetch fields
            async.parallel([
                // filter types
                function(callback) {
                    async.detect(types,function(type,callback){
                        if (type.encounter_type_id === item.encounter_type) callback(true);
                        else callback(false);
                    },function(result){
                        encounter.data.encounterType = result;
                        callback();
                    });
                },
                // filter form
                function(callback) {
                    async.detect(forms,function(form,callback){
                        if (form.form_id === item.form_id) callback(true);
                        else callback(false);
                    },function(result){
                        encounter.data.form = result;
                        callback();
                    });
                },
                // filter search tags
                function(callback) {
                    if (tags) 
                        async.detect(tags,function(tag,callback){
                            if (tag.encounter_id === encounter.id) callback(true);
                            else callback(false);
                        },function(result){
                            if (result) {
                                encounter.tags.push(result.given_name);
                                encounter.tags.push(result.middle_name);
                                encounter.tags.push(result.family_name);
                            }
                            callback();
                        });
                    else callback();
                }
            // callback, when all fields are set
            ],function(err,res) {
                // push BULK commands
                commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                commands.push(encounter);
                callback();
            });
        },function(err,res){
            // execute BULK
            searchserver.bulk(commands,{}).exec();
            commands = null;
            encounters = null;
            callback();
        });
    });
};     

Encounter.prototype.search = function(data,callback) {
    // prepare uuid for searching
    data = trimUUID(data);
    // resulting object
    var result = {
        result: {},
        data: [],
        id: []
    };
    var query = new Query(data);
    query.addField('tags');
    query.addFilter('type',objectType.encounter);
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // check each encounter
            async.each(value.data.hits,function(enc,callback){
                // fetch fields for each encounter
                async.parallel([
                    function(callback) {
                        // get location
                        if (enc._source.data.location)
                            getDataByField(objectType.location,'id',enc._source.data.location,function(location){
                                enc._source.data.location = location;
                                callback();
                            });
                        else callback();
                    },
                    function(callback) {
                        // get provider
                        if (enc._source.data.provider)
                            getDataByField(objectType.provider,'id',enc._source.data.provider,function(provider){
                                enc._source.data.provider = provider;
                                callback();
                            });
                        else callback();
                    },
                    function(callback) {
                        // get obs
                        getDataByField(objectType.obs,'encounter',enc._source.id,function(obs){
                            enc._source.data.obs = obs;
                            callback();
                        });
                    },
                    function(callback) {
                        // get order
                        getDataByField(objectType.order,'encounter',enc._source.id,function(order){
                            enc._source.data.order = order;
                            callback();
                        });
                    },
                    function(callback) {
                        // get patient
                        if (enc._source.data.patient)
                            getDataByField(objectType.patient,'id',enc._source.data.patient,function(patient){
                                enc._source.data.patient = patient;
                                callback();
                            });
                        else callback();
                    }
                // callback for each.item.item
                ],function(err,res){
                    // prepare result
                    result.result = value.result;
                    result.data.push(enc._source.data);
                    result.id.push(enc._source.id);
                    callback();
                });
            },function(err,res){
                callback(result);
            });
        }
        else {
            result.result = value.result;
            callback(result);
        }
    });
};
