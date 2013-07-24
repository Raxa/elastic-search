exports.ConceptDescription = ConceptDescription;

function ConceptDescription(module) {
    this.type = objectType.concept_description;
}

ConceptDescription.prototype.index = function(callback) {
    var query_desc = "SELECT concept_id,description,locale,uuid FROM concept_description";
    var commands = [];
    connection.query(query_desc, function(error, values, fields) {
        if (!error) {
            async.each(values,function(item,callback){
                var desc = {
                    id : item.concept_id,
                    type : objectType.concept_description,
                    data : {
                        description : item.description,
                        locale : item.locale,
                        uuid : item.uuid
                    }
                };
                // push BULK commands
                commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                commands.push(desc);
                callback();
            },function(err,res){
                searchserver.bulk(commands,{}).on('done',function(done){
                    callback();
                }).exec();
            });
        }
        else callback();
    }); 
};


