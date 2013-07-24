exports.Location = Location;

function Location(module) {

    /*
     * Private fields
     */

    trimUUID = module.trimUUID;
    getData = module.getData;
    getDataByField = module.getDataByField;

    /*
     * Public fields
     */

    this.type = objectType.location;
};

Location.prototype.index = function(callback) {
    // queries for getting data
    var query_attribute = "SELECT location_id,value_reference as valueReference,name,description,datatype \n\
                        FROM location_attribute,location_attribute_type WHERE \n\
                        location_attribute.attribute_type_id = location_attribute_type.location_attribute_type_id";
    var query_location = "SELECT location_id,uuid,name,description,address1,address2,address3,address4,address5,address6,\n\
                        city_village,state_province,postal_code,country,latitude,longitude,county_district,\n\
                        retired,parent_location FROM location";
    var query_tag = "SELECT location_id,name,description FROM location_tag,location_tag_map WHERE \n\
                        location_tag.location_tag_id = location_tag_map.location_tag_id";
    // buffers
    var attributes, tags, locations;
    // array for BULK
    var commands = [];
    // async get data from mysql db
    async.series([
    // get attributes
    function(callback) {
        connection.query(query_attribute, function(error, values, fields) {
            if (!error) attributes = values;
            callback();
        });
    },
    // get tags
    function(callback) {
        connection.query(query_tag, function(error, values, fields) {
            if (!error) tags = values;
            callback();
        });
    },
    // get locations
    function(callback) {
        connection.query(query_location, function(error, values, fields) {
            if (!error) locations = values;
            callback();
        });
    }
    // callback function
    ], function(err) {
        if (locations) {
            for (var a=0;a<locations.length;a++) {
                var item = locations[a];
                var location = {
                    id: item.location_id,
                    type: objectType.location,
                    tags : [item.name,item.uuid],
                    data: {
                        display: "location " + item.name,
                        name: item.name,
                        uuid: item.uuid,
                        description: item.description,
                        address1: item.address1,
                        address2: item.address2,
                        address3: item.address3,
                        address4: item.address4,
                        address5: item.address5,
                        address6: item.address6,
                        cityVillage: item.city_village,
                        stateProvince: item.state_province,
                        country: item.country,
                        postalCode: item.postal_code,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        countyDistrict: item.county_district,
                        parentLocation: item.parent_location,
                        tags: [],
                        attributes: []
                    }
                };
                // fetch fields
                async.parallel([
                // filter tags
                function(callback) {
                    if (tags) {
                        async.filter(tags, function(tag, callback) {
                            if (tag.location_id === location.id) callback(true);
                            else callback(false);
                        }, function(result) {
                            location.data.tags = result;
                            callback();
                        });
                    }
                    else callback();
                },
                // filter attributes
                function(callback) {
                    if (attributes) {
                        async.filter(attributes, function(attribute, callback) {
                            if (attribute.location_id === location.id) callback(true);
                            else callback(false);
                        }, function(result) {
                            location.data.attributes = result;
                            callback();
                        });
                    }
                    else callback();
                }
                // callback, when all fields are set
                ], function(err, res) {
                    // push BULK commands
                    commands.push({ "index" : { "_index" : indexName, "_type" : indexType} });
                    commands.push(location);
                });
            }
            // execute BULK
            searchserver.bulk(commands,{}).on('done',function(done) {
                callback();
            }).exec();
        }
        else callback();
    });
};

Location.prototype.search = function(data,callback) {
    // trim uuid value
    data = trimUUID(data);
    // prepare query
    var query;
    if (data === '') {
        query = new Query(this.type);
        query.addField('type');
    }
    else {
        query = new Query(data);
        query.addField('tags');
        query.addFilter('type',this.type);
    }
    // get locations
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each location
            async.each(value.data.hits,function(loc,callback){
                async.parallel([
                    // fetch child locations
                    function(callback) {
                        getDataByField(objectType.location,'parentLocation',loc._source.id,function(childs){
                            loc._source.data.childLocations = childs;
                            callback();
                        });
                    },
                    // fetch parent location
                    function(callback) {
                        if (loc._source.data.parentLocation) {
                            getDataByField(objectType.location,'id',loc._source.data.parentLocation,function(parent){
                                loc._source.data.parentLocation = parent;
                                callback();
                            });
                        }
                        else callback();
                    }
                ],function(err){
                    result.push(loc._source.data);
                    callback();
                });
            },function(err,res) {
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