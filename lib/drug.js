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
                              dosage_form AS 'data.dosgeForm',\n\
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
Drug.prototype.search = function(data,callback) {
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
        query.addField('tags.name');
        query.addField('tags.uuid');
        query.addFilter('type',this.type);
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
                if (drug._source.data.concept) {
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


