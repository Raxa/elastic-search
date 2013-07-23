exports.ConceptSet = ConceptSet;

function ConceptSet(module) {
    this.type = objectType.concept_set;
}

ConceptSet.prototype.index = function(callback) {
    var query_set = "SELECT concept_id,concept_set AS conceptSet,sort_weight AS sortWeight,uuid FROM concept_set";
    var commands = [];
    connection.query(query_set, function(error, values, fields) {
        if (!error) {
            async.each(values,function(item,callback){
                var set = {
                    id : item.concept_id,
                    type : objectType.concept_set,
                    data : {
                        conceptSet : item.conceptSet,
                        sortWeight : item.sortWeight,
                        uuid : item.uuid
                    }
                };
                // push BULK commands
                commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                commands.push(set);
                callback();
            },function(err,res){
                searchserver.bulk(commands,{}).exec();
                callback();
            });
        }
        else callback();
    }); 
};


