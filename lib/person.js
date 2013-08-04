exports.Person = Person;

function Person(module) {
    
    /*
     * Private fields
     */

    trimUUID = module.trimUUID;
    getData = module.getData;
    river = null;
    
    /*
     * Public fields
     */
    
    this.type = objectType.person;
}

/* Search person by uuid,name
 * 
 * @param {type} data - values for searching
 * @param {type} callback - function for returning data
 */
Person.prototype.search = function(data, callback) {
    // trim uuid value
    data = trimUUID(data);
    // prepare query
    var query;
    // prepare query for search persons
    if (data === '') {
        query = new Query(this.type);
        query.addField('type');
    }
    else {
        query = new Query(data);
        query.addField('tags.uuid');
        query.addField('tags.name1');
        query.addField('tags.name2');
        query.addField('tags.name3');
        query.addFilter('type',this.type);
    }
    // get all persons
    getData(query.q,function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each person
            async.each(value.data.hits,function(item,callback){
                // fetch field using async
                async.series([
                    // prepare 'preferredName'
                    function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','person_name');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data['preferredName'] = res.data.hits[0]._source.data;
                                callback();
                            }
                            else {
                                item._source.data['preferredName'] = null;
                                callback();
                            }
                        });
                    },
                    // prepare 'preferredAddress'
                    function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','person_address');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data['preferredAddress'] = res.data.hits[0]._source.data;
                                callback();
                            }
                            else {
                                item._source.data['preferredAddress'] = null;
                                callback();
                            }
                        });
                    },
                    // prepare 'attributes'
                    function(callback) {
                        var query = new Query(item._source.id);
                        query.addField('id');
                        query.addFilter('type','person_attribute');
                        getData(query.q,function(res) {
                            if ((res.result === searchResult.ok) && (res.data.total > 0)) {
                                item._source.data['attributes'] = [];
                                async.each(res.data.hits,function(i,callback){
                                    item._source.data.attributes.push(i._source.data);
                                    callback();
                                },function(err,res){
                                    callback();
                                })
                            }
                            else {
                                item._source.data['attributes'] = null;
                                callback();
                            }
                        });
                    }
                ],function(err,res){
                    result.push(item._source.data);
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
            else {
                callback({
                    'error' : {
                        message : errorType.server
                    }
                });
            }
        }
    });
};

Person.prototype.river = function(callback) {
    var query_person_name = "SELECT person_id AS 'id', 'person_name' AS 'type', given_name AS 'data.givenName', \n\
                            family_name AS 'data.familyName', middle_name AS 'data.middleName' FROM person_name";
    var query_person_address = "SELECT person_id AS 'id',address1 AS 'data.address1',address2 AS 'data.address2',\n\
                            city_village AS 'data.cityVillage', state_province as 'data.stateProvince',\n\
                            postal_code AS 'data.postalCode', country AS 'data.country', 'person_address' AS 'type' \n\
                            FROM person_address";
    var query_person_attribute = "SELECT person_id AS 'id', 'person_attribute' AS 'type', value AS 'data.value',\n\
                            name AS 'data.name', description AS 'data.description', format AS 'data.format', \n\
                            searchable AS 'data.searchable' FROM person_attribute,person_attribute_type WHERE \n\
                            person_attribute.person_attribute_type_id=person_attribute_type.person_attribute_type_id";
    var query_person = "SELECT person.person_id AS 'id', given_name AS 'tags.name1', middle_name AS 'tags.name2',\n\
                            family_name AS 'tags.name3', person.uuid AS 'tags.uuid', 'person' AS 'type',\n\
                             person.uuid AS 'data.uuid', gender AS 'data.gender', \n\
                            birthdate AS 'data.birthdate', birthdate_estimated AS 'data.birthdateEstimated', \n\
                            dead AS 'data.dead', death_date AS 'data.deathDate', cause_of_death AS 'data.causeOfDeath', \n\
                            person.voided AS 'data.voided' FROM person,person_name WHERE \n\
                            person.person_id = person_name.person_id";
    river = new River(module);
    async.series([
        function(callback) {
            river.make('person',query_person,callback);
        },
        function(callback) {
            river.make('person_name',query_person_name,callback);
        },
        function(callback) {
            river.make('person_address',query_person_address,callback);
        },
        function(callback) {
            river.make('person_attribute',query_person_attribute,callback);
        }
        // etc
    ],function(err,res) {
        callback();
    });
};

Person.prototype.remove = function(callback) {
    river = new River(module);
    async.series([
        function(callback) {
            river.drop('person',callback);
        },
        function(callback) {
            river.drop('person_name',callback);
        },
        function(callback) {
            river.drop('person_address',callback);
        },
        function(callback) {
            river.drop('person_attribute',callback);
        }
        // etc
    ],function(err,res) {
        callback(err);
    });
};


