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
    var attributes, tags, locations;
    // async get data from mysql db
    async.parallel([
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
        async.each(locations, function(item, callback) {
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
                async.filter(tags, function(tag, callback) {
                    if (tag.location_id === location.id) callback(true);
                    else callback(false);
                }, function(result) {
                    location.data.tags = result;
                    callback();
                });
            },
            // filter attributes
            function(callback) {
                async.filter(attributes, function(attribute, callback) {
                    if (attribute.location_id === location.id) callback(true);
                    else callback(false);
                }, function(result) {
                    location.data.attributes = result;
                    callback();
                });
            }
            // callback, when all fields are set
            ], function(err, res) {
                searchserver.index(indexName, indexType, location).on('data', function(data) {
                    callback();
                }).exec();    
            });
        }, function(err, res) {
            callback();
        });
    });
};

Location.prototype.search = function(data,callback) {
    // trim uuid value
    data = trimUUID(data);
    var result = {
        result: {},
        data: [],
        id: []
    };
    var query = new Query(data);
    query.addField('tags');
    query.addFilter('type',objectType.location);
    // get locations
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
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
                        getDataByField(objectType.location,'id',loc._source.data.parentLocation,function(parent){
                            loc._source.data.parentLocation = parent;
                            callback();
                        });
                    }
                ],function(err){
                    result.data.push(loc._source.data);
                    result.id.push(loc._source.id);
                    callback();
                });
            },function(err,res) {
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