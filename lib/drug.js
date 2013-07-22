exports.Drug = Drug;

function Drug(module) {
    
    /*
     * Private fields
     */
    
    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;
    
    /*
     * Public fields
     */
    
    this.type = objectType.drug;
}

Drug.prototype.index = function(callback) {
    // queries for getting data
    var query_drug = "SELECT drug_id AS id,uuid,name,retired,dosage_form,dose_strength,maximum_daily_dose,\n\
                            minimum_daily_dose,units,concept_id,combination,route FROM drug";
    // array for BULK
    var commands = [];
    connection.query(query_drug, function(error, values, fields) {
        if (!error) {
            for (var a=0;a<values.length;a++) {
                var item = values[a];
                var drug = {
                    id: item.id,
                    type: objectType.drug,
                    tags: [item.uuid,item.name],
                    data: {
                        uuid: item.uuid,
                        display: "drug " + item.name,
                        name: item.name,
                        retired: item.retired,
                        dosageForm: item.dosage_form,
                        doseStrength: item.dose_strength,
                        maximumDailyDose: item.maximum_daily_dose,
                        minimumDailyDose: item.minimum_daily_dose,
                        units: item.units,
                        concept: item.concept_id,
                        combination: item.combination,
                        route: item.route
                    }
                };
                // push BULK commands
                commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                commands.push(drug);
            }
            // execute BULK
            searchserver.bulk(commands,{}).on('data',function(data) {
                callback();
            }).exec();
        }
        else callback();
    });
};

Drug.prototype.search = function(data,callback) {
    // trim uuid
    data = trimUUID(data);
    var result = {
        result: {},
        data: []
    };
    if (data === '') {
        query = new Query(this.type);
        query.addField('type');
    }
    else {
        query = new Query(data);
        query.addField('tags');
        query.addFilter('type',this.type);
    }
    // get all drugs
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // check each drug
            async.each(value.data.hits,function(drug,callback){
                // get concept dy drug.concept
                getDataByField(objectType.concept,'id',drug._source.data.concept,function(concept) {
                    drug._source.data.concept = concept;
                    result.data.push(drug._source.data);
                    callback();
                });
            },function(err,res){
                result.result = value.result;
                callback(result);
            });
        }
        else {
            result.result = value.result;
            callback(result);
        }
    });
};


