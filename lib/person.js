exports.Person = Person;

function Person(module) {
    
    /*
     * Private fields
     */

    trimUUID = module.trimUUID;
    getData = module.getData;
    
    /*
     * Public fields
     */
    
    this.type = objectType.person;
}

Person.prototype.index = function(callback) {
    // queries for getting data
    var query_person_name = "SELECT person_id,given_name AS givenName,family_name AS familyName,\n\
                            middle_name as middleName FROM person_name";
    var query_person_address = "SELECT person_id,address1,address2,city_village AS cityVillage, \n\
                            state_province as stateProvince,postal_code as postalCode,country FROM person_address";
    var query_person_attribute = "SELECT person_id,value,name,description,\n\
                            format,searchable FROM person_attribute,person_attribute_type WHERE \n\
                            person_attribute.person_attribute_type_id=person_attribute_type.person_attribute_type_id";
    var query_person = "SELECT person_id,uuid,gender,birthdate,birthdate_estimated,\n\
                            dead,death_date,cause_of_death,voided FROM person";
    var names,attributes,adresses,persons;
    // async get data from mysql db
    async.parallel([
        // get names
        function(callback) {
            connection.query(query_person_name, function(error, values, fields) {
                if (!error) names = values;
                callback();
            });
        },
        // get attributes
        function(callback) {
            connection.query(query_person_attribute, function(error, values, fields) {
                if (!error) attributes = values;
                callback();
            });
        },
        // get address
        function(callback) {
            connection.query(query_person_address, function(error, values, fields) {
                if (!error) adresses = values;
                callback();
            });
        },
        // get persons
        function(callback) {
            connection.query(query_person, function(error, values, fields) {
                if (!error) persons = values;
                callback();
            });
        }
    // callback function
    ],function(err){
        async.each(persons,function(item,callback){
            var person = {
                    type: objectType.person,
                    id: item.person_id,
                    tags : [item.uuid],
                    data: {
                        display: {},
                        uuid: item.uuid,
                        gender: item.gender,
                        birthdate: item.birthdate,
                        birthdateEstimated: item.birthdate_estimated,
                        dead: item.dead,
                        deathDate: item.death_date,
                        causeOfDeath: item.cause_of_death,
                        attributes: [],
                        preferredName: {},
                        preferredAddress: {}
                    }
            };
            // fetch fields
            async.parallel([
                // filter names
                function(callback) {
                    async.detect(names,function(item,callback){
                        if (item.person_id === person.id) callback(true);
                        else callback(false);
                    },function(result){
                        if (result) {
                            // set person's field
                            person.data.preferredName = result;
                            person.data.display = result.givenName + ' ';
                            if (result.middleName) person.data.display+=(result.middleName + ' ');
                            person.data.display += result.familyName;
                            // fill tags
                            person.tags.push(result.middleName);
                            person.tags.push(result.givenName);
                            person.tags.push(result.familyName);
                        }
                        callback();
                    });
                },
                // filter attributes
                function(callback) {
                    async.filter(attributes,function(item,callback){
                        if (item.person_id === person.id) callback(true);
                        else callback(false);
                    },function(results){
                        if (results.length > 0) person.data.attributes = results;
                        callback();
                    });
                },
                // filter adresses
                function(callback) {
                    async.filter(adresses,function(item,callback){
                        if (item.person_id === person.id) callback(true);
                        else callback(false);
                    },function(results){
                        if (results.length > 0) person.data.preferredAddress = results[0];
                        callback();
                    });
                }
            // callback, when all fields are set
            ],function(err,res) {
                searchserver.index(indexName, indexType, person).on('data', function(data) {
                    callback();
                }).exec();    
                //callback();
            });
        },function(err,res){
            callback();
        });
    });
};        

/* Search person by uuid,name
 * 
 * @param {type} data - values for searching
 * @param {type} callback - function for returning data
 */
Person.prototype.search = function(d, callback) {
    // trim uuid value
    d = trimUUID(d);
    var result = {
        result: {},
        data: [],
        id: []
    };
    // prepare query for search persons
    var query = new Query(d);
    query.addField('tags');
    query.addFilter('type',objectType.person);
    getData(query.q,function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // check each person
            async.each(value.data.hits,function(item,callback){
                if (item) {
                    result.data.push(item._source.data);
                    result.id.push(item._source.id);
                }
                callback();
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


