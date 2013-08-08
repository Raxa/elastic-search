exports.Person = Person;

/* Class Person
 * 
 * 
 */
function Person(module) {
    // import finctions
    trimUUID = module.trimUUID;
    getData = module.getData;
    river = null;
    // set type
    this.type = objectType.person;
}

/* Prototype search
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
                        getDataByField(objectType.person_name,'id',item._source.id,function(name) {
                            if ((name) && (name.length > 1)) name = name[0];
                            item._source.data.prefferredName = name;
                            callback();
                        });
                    },
                    // prepare 'preferredAddress'
                    function(callback) {
                        getDataByField(objectType.person_address,'id',item._source.id,function(ads) {
                            if ((ads) && (ads.length > 1)) ads = ads[0];
                            item._source.data.preferredAddress = ads;
                            callback();
                        });
                    },
                    // prepare 'attributes'
                    function(callback) {
                        getDataByField(objectType.person_attribute,'id',item._source.id,function(ats) {
                            item._source.data.attributes = ats;
                            callback();
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

/* Prototype river
 *  
 * 
 */
Person.prototype.river = function(callback) {
    // get names
    var query_person_name =     "SELECT person_id AS 'id',\n\
                                        'person_name' AS 'type',\n\
                                        given_name AS 'data.givenName',\n\
                                        family_name AS 'data.familyName',\n\
                                        middle_name AS 'data.middleName' \n\
                                   FROM person_name";
    // get addresses
    var query_person_address =  "SELECT person_id AS 'id',\n\
                                        address1 AS 'data.address1',\n\
                                        address2 AS 'data.address2',\n\
                                        city_village AS 'data.cityVillage',\n\
                                        state_province as 'data.stateProvince',\n\
                                        postal_code AS 'data.postalCode',\n\
                                        country AS 'data.country',\n\
                                        'person_address' AS 'type' \n\
                                   FROM person_address";
    // get attributes
    var query_person_attribute= "SELECT person_id AS 'id',\n\
                                        'person_attribute' AS 'type',\n\
                                        value AS 'data.value',\n\
                                        name AS 'data.name',\n\
                                        description AS 'data.description',\n\
                                        format AS 'data.format',\n\
                                        searchable AS 'data.searchable' \n\
                                   FROM person_attribute,\n\
                                        person_attribute_type \n\
                                  WHERE person_attribute.person_attribute_type_id=person_attribute_type.person_attribute_type_id";
    // get persons
    var query_person =          "SELECT person.person_id AS 'id',\n\
                                        given_name AS 'tags.name1',\n\
                                        middle_name AS 'tags.name2',\n\
                                        family_name AS 'tags.name3',\n\
                                        person.uuid AS 'tags.uuid',\n\
                                        'person' AS 'type',\n\
                                        person.uuid AS 'data.uuid',\n\
                                        gender AS 'data.gender',\n\
                                        'person' AS 'data.display',\n\
                                        birthdate AS 'data.birthdate',\n\
                                        birthdate_estimated AS 'data.birthdateEstimated',\n\
                                        dead AS 'data.dead', death_date AS 'data.deathDate', cause_of_death AS 'data.causeOfDeath', \n\
                                        person.voided AS 'data.voided' \n\
                                   FROM person,\n\
                                        person_name \n\
                                  WHERE person.person_id = person_name.person_id";
    var river = new River(module);
    async.series([
        function(callback) {
            river.make(objectType.person,query_person,callback);
        },
        function(callback) {
            river.make(objectType.person_name,query_person_name,callback);
        },
        function(callback) {
            river.make(objectType.person_address,query_person_address,callback);
        },
        function(callback) {
            river.make(objectType.person_attribute,query_person_attribute,callback);
        }
        // etc
    ],function(err,res) {
        callback();
    });
};

/* Prototype remove
 * 
 * 
 */
Person.prototype.remove = function(callback) {
    var river = new River(module);
    async.series([
        function(callback) {
            river.drop(objectType.person,callback);
        },
        function(callback) {
            river.drop(objectType.person_name,callback);
        },
        function(callback) {
            river.drop(objectType.person_address,callback);
        },
        function(callback) {
            river.drop(objectType.person_attribute,callback);
        }
        // etc
    ],function(err,res) {
        callback(err);
    });
};


