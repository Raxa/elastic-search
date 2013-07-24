exports.Order = Order;

function Order(module) {
    
    /*
     * Private fields
     */
    
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    
    /*
     * Public fields
     */
    
    this.type = objectType.order;
};

Order.prototype.index = function(callback) {
    // queries for getting data
     var query_orders = "SELECT order_id,concept_id,orders.patient_id,instructions,start_date,auto_expire_date,\n\
                    orderer,orders.encounter_id,accession_number,discontinued_by,discontinued_date,\n\
                    discontinued_reason,order_type_id,orders.uuid FROM orders,encounter WHERE \n\
                    encounter.encounter_id = orders.encounter_id";
    var query_type = "SELECT order_type_id AS id,name,description FROM order_type";
    var query_tags = "SELECT order_id,middle_name,given_name,family_name FROM order,person_name WHERE\n\
            order.patient_id = person_name.person_id";
    // buffers
    var orders,types,tags;
    // array for BULK
    var commands = [];
    // async get data from mysql db
    async.series([
        // get orders
        function(callback) {
            connection.query(query_orders, function(error, values, fields) {
                if (!error) orders = values;
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
        // get tags
        function(callback) {
            connection.query(query_tags, function(error, values, fields) {
                if (!error) tags = values;
                callback();
            });
        }
    // callback function
    ],function(err){
        if (orders) {
            for (var a=0;a<orders.length;a++) {
                var item = orders[a];
                var order = {
                    id: item.order_id,
                    type: objectType.order,
                    tags: [item.uuid],
                    data: {
                        display : 'order ' + item.start_date + ' - ' + item.auto_expire_date,
                        patient: item.patient_id,
                        uuid : item.uuid,
                        concept: item.concept_id,
                        instructions: item.instructions,
                        startDate: item.start_date,
                        autoExpireDate: item.auto_expire_date,
                        encounter: item.encounter_id,
                        orderer: item.orderer,
                        accessionNumber: item.accession_number,
                        discontinuedBy: item.discntinued_by,
                        discontinuedDate: item.discntinued_by,
                        discontinuedReason: item.discntinued_reason,
                        orderType: {}
                    }
                };
                // fetch fields
                async.parallel([
                    // filter types
                    function(callback) {
                        if ((types) && (item.order_type_id)) {
                            async.detect(types,function(type,callback){
                                if (type.id === item.order_type_id) callback(true);
                                else callback(false);
                            },function(result){
                                order.data.orderType = result;
                                callback();
                            });
                        }
                        else callback();
                    },
                    // filter tags
                    function(callback) {
                        if (tags) {
                            async.detect(tags,function(tag,callback){
                                if (tag.order_id === order.id) callback(true);
                                else callback(false);
                            },function(result){
                                if (result) {
                                    order.tags.push(result.family_name);
                                    order.tags.push(result.given_name);
                                    if (result.middle_name) order.tags.push(result.middle_name);
                                }
                                callback();
                            });
                        }
                        else callback();
                    }
                // callback, when all fields are set
                ],function(err,res) {
                    // push BULK commands
                    commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                    commands.push(order);
                });
            }
            // execute BULK
            searchserver.bulk(commands,{}).on('done',function(done) {
                callback();
            }).exec();
        }
        else callback();
    });
};

Order.prototype.search = function(data,callback) {
    // trim uuid
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
            async.each(value.data.hits,function(order,callback){
                // fetch fields
                async.parallel([
                    function(callback) {
                        // fetch concept
                        if (order._source.data.concept) {
                            getDataByField(objectType.concept,'id',order._source.data.concept,function(concept){
                                if ((concept) && (concept.length > 1)) order._source.data.concept = concept[0];
                                else order._source.data.concept = concept;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // fetch encounter
                        if (order._source.data.encounter) {
                            getDataByField(objectType.encounter,'id',order._source.data.encounter,function(enc){
                                order._source.data.encounter = enc;
                                callback();
                            });
                        }
                        else callback();
                    },
                    function(callback) {
                        // fetch patient
                        if (order._source.data.patient) {
                            getDataByField(objectType.patient,'id',order._source.data.patient,function(pat){
                                order._source.data.patient = pat;
                                callback();
                            });
                        }
                        else callback();
                    }
                ],function(err){
                    result.push(order._source.data);
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
