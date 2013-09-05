exports.Person = Person;

/* Class Person
 * adding, removing, searching 'person'
 * 
 */
function Person() {
    this.type = objectType.person;
}

/* Prototype river
 * add river for updating persons
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
    var river = new River();
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
    ],function(err,res) {
        callback();
    });
};

/* Prototype search
 * 
 * @param {type} data - value for searching
 * @param {type} options - request options
 * @param {type} user - user authorization data
 * @param {type} callback - function for returning data
 * @returns {undefined} 
 */
Person.prototype.search = function(data, options, user, callback) {
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
            query = new Query(tokenizeValue(searchvalue));
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
    // get all persons
    getData(query.q,function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each person
            async.each(value.data.hits,function(item,callback){
                // accept flag
                var accept = false;
                // fetch field using async
                async.series([
                    // check access rights to this object
                    function(callback) {
                        getDataByField(objectType.user_resource,'data.person',item._source.id,function(items) {
                            // if there are groups with this person
                            if (items) {
                                // if it is single object - make an array with this obejct
                                if (!items.length) items = [items];
                                async.each(items,function(item,callback){
                                    // if resource group === user group
                                    if (user.group.indexOf(item.id) !== -1) accept = true;
                                    callback();
                                },function(res){
                                    callback();
                                });
                            }
                            else callback();
                        });
                    },
                    // prepare 'preferredName'
                    function(callback) {
                        if (!options.quick) {
                            getDataByField(objectType.person_name,'id',item._source.id,function(name) {
                                if ((name) && (name.length > 1)) name = name[0];
                                item._source.data.prefferredName = name;
                                callback();
                            });
                        }
                        else callback();
                    },
                    // prepare 'preferredAddress'
                    function(callback) {
                        if (!options.quick) {
                            getDataByField(objectType.person_address,'id',item._source.id,function(ads) {
                                if ((ads) && (ads.length > 1)) ads = ads[0];
                                item._source.data.preferredAddress = ads;
                                callback();
                            });
                        }
                        else callback();
                    },
                    // prepare 'attributes'
                    function(callback) {
                        if (!options.quick) {
                            getDataByField(objectType.person_attribute,'id',item._source.id,function(ats) {
                                item._source.data.attributes = ats;
                                callback();
                            });
                        }
                        else callback();
                    }
                ],function(err,res){
                    if (accept === true) result.push(item._source.data);
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

/* Prototype remove
 * remove river for updating persons
 * 
 */
Person.prototype.remove = function(callback) {
    var river = new River();
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
    ],function(err,res) {
        callback(err);
    });
};


