exports.Order = Order;

/* Class Order
 * 
 * 
 */
function Order(module) {
    // import functions
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    // set type
    this.type = objectType.order;
};

/* Prototype river
 * 
 * 
 */
Order.prototype.river = function(callback) {
     // get orders
     var query_order = "SELECT order_id AS 'id',\n\
                              concept_id AS 'data.concept',\n\
                              orders.patient_id AS 'data.patient',\n\
                              given_name AS 'tags.name1',\n\
                              family_name AS 'tags.name2',\n\
                              middle_name AS 'tags.name3',\n\
                              instructions AS 'data.instructions',\n\
                              start_date AS 'data.startDate',\n\
                              orders.uuid AS 'tags.uuid',\n\
                              auto_expire_date AS 'data.autoExpireDate',\n\
                              orderer AS 'data.orderer',\n\
                              orders.encounter_id AS 'data.encounter',\n\
                              accession_number AS 'data.accessionNumber',\n\
                              discontinued_by AS 'data.discontinuedBy',\n\
                              discontinued_date AS 'data.discontinuedDate',\n\
                              discontinued_reason AS 'data.discontinuedReason',\n\
                              orders.uuid AS 'data.uuid',\n\
                              'order' AS 'data.display',\n\
                              name AS 'data.orderType.name',\n\
                              description AS 'data.orderType.description',\n\
                              'order' AS 'type' \n\
                         FROM encounter,\n\
                              order_type,\n\
                              orders,\n\
                              person_name \n\
                        WHERE encounter.encounter_id = orders.encounter_id \n\
                          AND orders.order_type_id = order_type.order_type_id \n\
                          AND orders.patient_id = person_name.person_id ";
    river = new River(module);
    async.series([
        function(callback) {
            river.make(objectType.order,query_order,callback);
        }
        // etc
    ],function(err,res) {
        callback();
    });
};

/* Prototype search
 * 
 * 
 */
Order.prototype.search = function(data, options, callback) {
    // query object
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
    // get orders by uuid
    getData(query.q, function(value) {
        // if there was no error, and we gat data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            async.each(value.data.hits,function(order,callback){
                if (!options.quick) {
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
                }
                else {
                    result.push(order._source.data);
                    callback();
                }
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
 * 
 * 
 */
Order.prototype.remove = function(callback) {
    river = new River(module);
    async.series([
        function(callback) {
            river.drop(objectType.order,callback);
        }
        // etc
    ],function(err,res) {
        callback(err);
    });
};
