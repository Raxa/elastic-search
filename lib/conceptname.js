exports.ConceptName = ConceptName;

function ConceptName(module) {
    this.type = objectType.concept_name;
};

ConceptName.prototype.index = function(callback) {
    var query_name = "SELECT concept_id,name,locale,uuid FROM concept_name";
    var commands = [];
    connection.query(query_name,function(error,values,fields) {;
      if (!error) {
            async.each(values,function(item,callback){
                var name = {
                    id : item.concept_id,
                    type : objectType.concept_name,
                    data : {
                        name : item.name,
                        locale : item.locale,
                        uuid : item.uuid
                    }
                };
                // push BULK commands
                commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                commands.push(name);
                callback();
            },function(err,res) {
                searchserver.bulk(commands,{}).on('done',function(){
                    callback();
                }).exec();
                
            });
        }
        else callback(); 
    }); 
};

