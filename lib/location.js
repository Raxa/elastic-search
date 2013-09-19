exports.Location = Location;

/* Class Location
 * adding, removing, searching 'location'
 * 
 */
function Location() {
    this.type = objectType.location;
};

/* Prototype river
 * add river for updating locations
 * 
 */
Location.prototype.river = function(callback) {
    // get attributes
    var query_attribute = "SELECT location_id AS 'location_id', \n\
                                  CONCAT('location_attribute',location_attribute_id) AS '_id',\n\
                                  value_reference AS 'data.valueReference',\n\
                                  name AS 'data.name', \n\
                                  description AS 'data.description',\n\
                                  datatype AS 'data.datatype',\n\
                                  'location_attribute' AS 'type' \n\
                             FROM location_attribute,\n\
                                  location_attribute_type \n\
                            WHERE location_attribute.attribute_type_id = location_attribute_type.location_attribute_type_id";
    // get locations
    var query_location =  "SELECT location_id AS 'id',\n\
                                  CONCAT('location',location_id) AS '_id',\n\
                                  uuid AS 'data.uuid',\n\
                                  name AS 'data.name',\n\
                                  description AS 'data.description',\n\
                                  address1 AS 'data.address1',\n\
                                  address2 AS 'data.address2',\n\
                                  address3 AS 'data.address3',\n\
                                  address4 AS 'data.address4',\n\
                                  address5 AS 'data.address5',\n\
                                  address6 AS 'data.address6',\n\
                                  'location' AS 'type',\n\
                                  city_village AS 'data.cityVillage',\n\
                                  state_province AS 'data.stateProvince',\n\
                                  postal_code AS 'data.postalCode',\n\
                                  country AS 'data.country',\n\
                                  latitude AS 'data.latitude',\n\
                                  longitude AS 'data.longitude', \n\
                                  county_district AS 'data.countryDistrict',\n\
                                  retired AS 'data.retired',\n\
                                  CONCAT('Location ',name) AS 'data.display',\n\
                                  parent_location AS 'data.parentLocation',\n\
                                  uuid AS 'tags.uuid',\n\
                                  name AS 'tags.name' \n\
                             FROM location";
    // get tags
    var query_tag =       "SELECT location_id AS 'location_id',\n\
                                  CONCAT('location',location_tag.location_tag_id,location_id) AS '_id',\n\
                                  name AS 'data.name',\n\
                                  description AS 'data.description'\n\
                                  'location_tag' AS 'type'\n\
                             FROM location_tag,\n\
                                  location_tag_map\n\
                            WHERE location_tag.location_tag_id = location_tag_map.location_tag_id";
    var river = new River();
    async.series([
        function(callback) {
            river.make(objectType.location,query_location,callback);
        },
        function(callback) {
            river.make(objectType.location_attribute,query_attribute,callback);
        },
        function(callback) {
            river.make(objectType.location_tag,query_tag,callback);
        }
    ],function(err,res) {
        callback();
    });
};

/* Prototype search
 * 
 * @param {type} data - value for searching
 * @param {type} options - request options
 * @param {type} callback - function for returning data
 * @returns {undefined} 
 */
Location.prototype.search = function(data, options, callback) {
    var query = new Query(this.type);
    // if any options selected
    if ((data) || (options.q)) {
        var key = (data) ? data : options.q;
        if (key !== trimUUID(key)) {
            key = trimUUID(key);
            query.addOption('tags.uuid',key);
        }
        else query.addFuzzyOption('tags.name',key);
    }
    // get locations
    getData(query.q, function(value) {
        // if there was no error, and we get data
        if ((value.result === searchResult.ok) && (value.data.total > 0)) {
            // resulting object
            var result = [];
            // check each location
            async.each(value.data.hits,function(loc,callback){
                if (!options.quick) {
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
                        },
                        // get tags
                        function(callback) {
                            getDataByField(objectType.location_tag,'location_id',loc._source.id,function(tags){
                                loc._source.data.tags = tags;
                                callback();
                            });
                        },
                        // get attributes
                        function(callback) {
                            getDataByField(objectType.location_attribute,'location_id',loc._source.id,function(atts){
                                loc._source.data.attributes = atts;
                                callback();
                            });
                        }
                    ],function(err){
                        result.push(loc._source.data);
                        callback();
                    });
                }
                else {
                    result.push(loc._source.data);
                    callback();
                }
            },function(err,res) {
                callback(result);
            });
        }
        else {
            if (value.result === searchResult.ok) callback([]);
            else 
            callback({
                'error' : {
                    message : errorType.server
                }
            });
        }
    });
};

/* Prototype remove
 * remove river for updating locations
 * 
 */
Location.prototype.remove = function(callback) {
    var river = new River();
    async.series([
        function(callback) {
            river.drop(objectType.location,callback);
        },
        function(callback) {
            river.drop(objectType.location_tag,callback);
        },
        function(callback) {
            river.drop(objectType.location_attribute,callback);
        }
    ],function(err,res) {
        callback(err);
    });
};