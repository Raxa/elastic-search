exports.Drug = Drug;

/* Class Drug
 * 
 * 
 */
function Drug(module) {
    // import functions
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    // set type
    this.type = objectType.drug;
}

/* Prototype river
 * 
 * 
 */
Drug.prototype.river = function(callback) {
    // get drugs
    var query_drug = "SELECT drug_id AS 'id',\n\
                             'drug' AS 'type',\n\
                              uuid AS 'data.uuid',\n\
                              name AS 'data.name',\n\
                              uuid AS 'tags.uuid',\n\
                              name AS 'tags.name',\n\
                              retired AS 'data.retired',\n\
                              dosage_form AS 'data.dosageForm',\n\
                              dose_strength AS 'data.doseStrength',\n\
                              'drug' AS 'data.display',\n\
                              maximum_daily_dose AS 'data.maximumDailyDose',\n\
                              minimum_daily_dose AS 'data.minimumDailyDose', \n\
                              units AS 'data.units',\n\
                              concept_id AS 'data.concept',\n\
                              combination AS 'data.combination',\n\
                              route AS 'data.route' \n\
                         FROM drug";
    river = new River(module);
    async.series([
        function(callback) {
            river.make(objectType.drug,query_drug,callback);
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
Drug.prototype.search = function(data, options, callback) {
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
            query.addField('tags.name');
        }
        //filter only data with this type
        query.addFilter('type',this.type);
    }
    // if we need to get all values
    else {
        query = new Query(this.type);
        query.addField('type');
    }
    // get all drugs
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each drug
            async.each(value.data.hits,function(drug,callback){
                // get concept dy drug.concept
                if ((drug._source.data.concept) && (!options.quick)) {
                    getDataByField(objectType.concept,'id',drug._source.data.concept,function(concept) {
                        drug._source.data.concept = concept;
                        result.push(drug._source.data);
                        callback();
                    });
                }
                // if concept === null
                else {
                    result.push(drug._source.data);
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
Drug.prototype.remove = function(callback) {
    river = new River(module);
    async.series([
        function(callback) {
            river.drop(objectType.drug,callback);
        }
        // etc
    ],function(err,res) {
        callback(err);
    });
};


