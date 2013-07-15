// DEBUG flag
var DEBUG = false;
var INDX = false;

// required modules
var http = require('http');
var path = require('path');
var fs = require('fs');
var async = require('async');

// class for reading/saving settings
function Settings() {
    this.mysqlUser = 'root';
    this.mysqlPass = 'ermolenko';
    this.mysqlDb = 'openmrs';
    this.url = 'localhost';
    this.port = '1024';
    this.esPort = '9200';
    this.esUrl = 'localhost';
    this.indexed = 'false';
};

// class for search layer
function ElasticSearch() {

    /*
     * Private attributes/methods
     */
    
    // mysql module
    var mysql = require("/usr/local/lib/node_modules/mysql");
    // elastic search module
    var ElasticSearchClient = require('/usr/local/lib/node_modules/elasticsearchclient');
    var settings = new Settings();
    // open MySQL connection
    var connection = mysql.createConnection({
        user: settings.mysqlUser,
        password: settings.mysqlPass,
        database: settings.mysqlDb
    });
    // create searchserver object
    
    var searchserver = new ElasticSearchClient({
        host: settings.esUrl,
        port: settings.esPort
    });
    // name for indexing
    var indexName = 'openmrs_test';
    // type of index
    var indexType = 'document';
    // search types
    var searchType = {
        plain: 'plain',
        single: 'single'
    };
    // result of search
    var searchResult = {
        ok: 'ok',
        error: 'error'
    };
    // types for search
    var objectType = {
        person: 'person',
        patient: 'patient',
        provider: 'provider',
        drug: 'drug',
        obs: 'obs',
        order: 'order',
        encounter: 'encounter',
        location: 'location',
        concept: 'concept',
        concept_set : 'concept_set',
        concept_name : 'concept_name',
        concept_answer : 'concept_answer',
        concept_description : 'concept_description'
    };
    // error types
    var errorType = {
        incorr_data : 'Incorrect value for searching',
        unimplemented : 'This type is not implemented yet',
        server_err : 'Server error'
    };

    // prepare array of persons
    var preparePersons = function(callback) {
            var query_person_name = "SELECT person_id,given_name AS givenName,family_name AS familyName,\n\
                            middle_name as middleName FROM person_name";
            var query_person_address = "SELECT person_id,address1,address2,city_village AS cityVillage, \n\
                            state_province as stateProvince,postal_code as postalCode,country FROM person_address";
            var query_person_attribute = "SELECT person_id,value,name,description,\n\
                            format,searchable FROM person_attribute,person_attribute_type WHERE \n\
                            person_attribute.person_attribute_type_id=person_attribute_type.person_attribute_type_id";
            var query_person = "SELECT person_id,uuid,gender,birthdate,birthdate_estimated,\n\
                            dead,death_date,cause_of_death,voided FROM person";
            // get all attributes
            connection.query(query_person_attribute, function(error, attributes, fields) {
                if (!error) {
                    // get all names
                    connection.query(query_person_name, function(error, names, fields) {
                        if (!error) {
                            // get all adresses
                            connection.query(query_person_address, function(error, addresses, fields) {
                                if (!error) {
                                    // get all persons
                                    connection.query(query_person, function(error, persons, fields) {
                                        if (!error) {
                                            if (DEBUG) console.log('indexing persons: ' + persons.length);
                                            // array for persons
                                            for (var a = 0; a < persons.length; a++) {
                                                var person = {
                                                    type: objectType.person,
                                                    id: persons[a].person_id,
                                                    data: {
                                                        display: {},
                                                        uuid: persons[a].uuid,
                                                        gender: persons[a].gender,
                                                        birthdate: persons[a].birthdate,
                                                        birthdateEstimated: persons[a].birthdate_estimated,
                                                        dead: persons[a].dead,
                                                        deathDate: persons[a].death_date,
                                                        causeOfDeath: persons[a].cause_of_death,
                                                        attributes: [],
                                                        preferredName: {},
                                                        preferredAddress: {}
                                                    }
                                                };
                                                // fetch attributes
                                                for (var b = 0; b < attributes.length; b++)
                                                if (attributes[b].person_id === persons[a].person_id) person.data.attributes.push(attributes[b]);
                                                // fetch preferredName
                                                for (var d = 0; d < names.length; d++)
                                                if (names[d].person_id === persons[a].person_id) {
                                                    person.data.preferredName = names[d];
                                                    person.data.display = names[d].givenName + " " + names[d].middleName + " " + names[d].familyName;
                                                }
                                                // fetch preferredAddress
                                                for (var e = 0; e < addresses.length; e++)
                                                if (addresses[e].person_id === persons[a].person_id) person.data.preferredAddress = addresses[e];
                                                searchserver.index(indexName, indexType, person).on('data', function(data) {}).exec();
                                            }
                                            if (callback) callback(true);
                                        } else callback(false);
                                    });
                                } else callback(false);
                            });
                        } else callback(false);
                    });
                } else callback(false);
            });
        };

    // prepare array of patients
    var preparePatients = function(callback) {
            var query_patient = "SELECT patient_id,voided FROM patient";
            var query_identifier = "SELECT patient_id,identifier,name,description,format,voided FROM \n\
                        patient_identifier,patient_identifier_type WHERE patient_identifier.identifier_type =\n\
                        patient_identifier_type.patient_identifier_type_id";
            var query_person = "SELECT person_id,uuid FROM person";
            // get all identifiers
            connection.query(query_identifier, function(error, identifiers, fields) {
                if (!error) {
                    // get all patients
                    connection.query(query_patient, function(error, pats, fields) {
                        if (!error) {
                            // get all persons
                            if (DEBUG) console.log('indexing patients: ' + pats.length);
                            connection.query(query_person, function(error, persons, fields) {
                                if (!error) {
                                    for (var a = 0; a < pats.length; a++) {
                                        var patient = {
                                            id: pats[a].patient_id,
                                            type: objectType.patient,
                                            data: {
                                                voided: pats[a].voided,
                                                identifiers: [],
                                                uuid: {},
                                                display : {}
                                            }
                                        };
                                        // fetch identifiers
                                        for (var z = 0; z < identifiers.length; z++)
                                        if (identifiers[z].patient_id === pats[a].patient_id) patient.data.identifiers.push(identifiers[z]);
                                        // fetch uuid
                                        for (var b = 0; b < persons.length; b++)
                                        if (persons[b].person_id === pats[a].patient_id) {
                                            patient.data.uuid = persons[b].uuid;
                                            patient.data.display = "patient " + persons[b].display;
                                        }
                                        searchserver.index(indexName, indexType, patient).on('data', function(data) {}).exec();
                                    }
                                    if (callback) callback(true);
                                } else callback(false);
                            });
                        } else callback(false);
                    });
                } else callback(false);
            });
        };

    // prepare array of providers
    var prepareProviders = function(callback) {
            var query_attribute = "SELECT provider_id,value_reference AS valueReference,name,description,datatype FROM \n\
                            provider_attribute,provider_attribute_type WHERE \n\
                            provider_attribute.attribute_type_id = provider_attribute_type.provider_attribute_type_id";
            var query_provider = "SELECT provider_id,person_id,name,identifier,retired,uuid FROM provider";
            connection.query(query_attribute, function(error, attributes, fields) {
                if (!error) {
                    connection.query(query_provider, function(error, provs, fields) {
                        if (!error) {
                            if (DEBUG) console.log('indexing providers: ' + provs.length);
                            for (var a = 0; a < provs.length; a++) {
                                var provider = {
                                    id: provs[a].provider_id,
                                    type: objectType.provider,
                                    data: {
                                        display : "provider " + provs[a].name,
                                        name: provs[a].name,
                                        uuid: provs[a].uuid,
                                        identifier: provs[a].identifier,
                                        retired: provs[a].retired,
                                        attributes: [],
                                        person: provs[a].person_id
                                    }
                                };
                                // fetch attributes
                                for (var b = 0; b < attributes.length; b++) if (attributes[b].provider_id === provs[a].provider_id) provider.data.attributes.push(attributes[b]);
                                searchserver.index(indexName, indexType, provider).on('data', function(data) {}).exec();
                            }
                            if (callback) callback(true);
                        } else callback(false);
                    });
                } else callback(false);
            });
        };

    var prepareLocations = function(callback) {
            var query_attribute = "SELECT location_id,value_reference as valueReference,name,description,datatype \n\
                                FROM location_attribute,location_attribute_type WHERE \n\
                                location_attribute.attribute_type_id = location_attribute_type.location_attribute_type_id";
            var query_location = "SELECT location_id,uuid,name,description,address1,address2,address3,address4,address5,address6,\n\
                                city_village,state_province,postal_code,country,latitude,longitude,county_district,\n\
                                retired,parent_location FROM location";
            var query_tag = "SELECT location_id,name,description FROM location_tag,location_tag_map WHERE \n\
                                location_tag.location_tag_id = location_tag_map.location_tag_id";
            // get all tags
            connection.query(query_tag, function(error, tags, fields) {
                if (!error) {
                    // get all attributes
                    connection.query(query_attribute, function(error, attributes, fields) {
                        if (!error) {
                            // get all locations
                            connection.query(query_location, function(error, locs, fields) {
                                if (!error) {
                                    if (DEBUG) console.log('indexing locations: ' + locs.length);
                                    for (var a = 0; a < locs.length; a++) {
                                        var location = {
                                            id: locs[a].location_id,
                                            type: objectType.location,
                                            data: {
                                                display : "location " + locs[a].name,
                                                name: locs[a].name,
                                                uuid: locs[a].uuid,
                                                description: locs[a].description,
                                                address1: locs[a].address1,
                                                address2: locs[a].address2,
                                                address3: locs[a].address3,
                                                address4: locs[a].address4,
                                                address5: locs[a].address5,
                                                address6: locs[a].address6,
                                                cityVillage: locs[a].city_village,
                                                stateProvince: locs[a].state_province,
                                                country: locs[a].country,
                                                postalCode: locs[a].postal_code,
                                                latitude: locs[a].latitude,
                                                longitude: locs[a].longitude,
                                                countyDistrict: locs[a].county_district,
                                                parentLocation : locs[a].parent_location,
                                                tags: [],
                                                attributes: []
                                            }
                                        };
                                        // fetch tags
                                        for (var b = 0; b < tags.length; b++) if (tags[b].location_id === locs[a].location_id) location.data.tags.push(tags[b]);
                                        // fetch attributes
                                        for (var c = 0; c < attributes.length; c++)
                                        if (attributes[c].location_id === locs[a].location_id) location.data.attributes.push(attributes[c]);
                                        searchserver.index(indexName, indexType, location).on('data', function(data) {}).exec();
                                    }
                                    if (callback) callback(true);
                                } else callback(false);
                            });
                        } else callback(false);
                    });
                } else callback(false);
            });
        };

    var prepareObs = function(callback) {
            var query_obs = "SELECT obs_id,uuid,person_id,concept_id,encounter_id,order_id,obs_datetime,\n\
                        value_modifier,accession_number,obs_group_id,value_coded_name_id,comments,location_id,\n\
                        voided,value_complex FROM obs";
            connection.query(query_obs, function(error, obss, fields) {
                if (!error) {
                    if (DEBUG) console.log('indexing obs: ' + obss.length);
                    var total = 0;
                    obss.forEach(function(item){
                        var obs = {
                            id: item.obs_id,
                            type: objectType.obs,
                            data: {
                                display : 'obs value ' + item.value_complex,
                                uuid: item.uuid,
                                id: item.obs_id,
                                person: item.person_id,
                                encounter : item.encounter_id,
                                concept: item.concept_id,
                                location: item.location_id,
                                order: item.order_id,
                                value: item.value_complex,
                                valueModifier: item.value_modifier,
                                obsDatetime: item.obs_datetime,
                                accessionNumber: item.accession_number,
                                obsGroup: item.obs_group_id,
                                valueCodedName: item.value_coded_name_id,
                                comment: item.comments,
                                voided: item.voided
                            }
                        };
                        searchserver.index(indexName, indexType, obs).on('data', function(data) {}).exec();
                        total++;
                        if (total === obss.length) callback(true);
                    });
                } else callback(false);
            });
        };

    var prepareOrders = function(callback) {
            var query_orders = "SELECT order_id,concept_id,orders.patient_id,instructions,start_date,auto_expire_date,\n\
                            orderer,orders.encounter_id,accession_number,discontinued_by,discontinued_date,\n\
                            discontinued_reason,order_type_id,orders.uuid FROM orders,encounter WHERE \n\
                            encounter.encounter_id = orders.encounter_id";
            var query_type = "SELECT order_type_id AS id,name,description FROM order_type";
            // get all types
            connection.query(query_type, function(error, types, fields) {
                if (!error) {
                    // get all orders
                    connection.query(query_orders, function(error, values, fields) {
                        if (!error) {
                            if (DEBUG) console.log('indexing orders: ' + values.length);
                            for (var a = 0; a < values.length; a++) {
                                var order = {
                                    id: values[a].order_id,
                                    type: objectType.order,
                                    data: {
                                        display : 'order ' + values[a].start_date + ' - ' + values[a].auto_expire_date,
                                        patient: values[a].patient_id,
                                        concept: values[a].concept_id,
                                        instructions: values[a].instructions,
                                        startDate: values[a].start_date,
                                        autoExpireDate: values[a].auto_expire_date,
                                        encounter: values[a].encounter_id,
                                        orderer: values[a].orderer,
                                        accessionNumber: values[a].accession_number,
                                        discontinuedBy: values[a].discntinued_by,
                                        discontinuedDate: values[a].discntinued_by,
                                        discontinuedReason: values[a].discntinued_reason,
                                        orderType: {}
                                    }
                                };
                                // fetch orderType
                                for (var b = 0; b < types.length; b++)
                                if (types[b].id === values[a].order_type_id) order.data.orderType = types[b];
                                searchserver.index(indexName, indexType, order).on('data', function(data) {}).exec();
                            }
                            if (callback) callback(true);
                        } else callback(false);
                    });
                } else callback(false);
            });
        };

    var prepareEncounters = function(callback) {
            var query_encounters = "SELECT encounter.encounter_id,encounter_type,patient_id,location_id,form_id,\n\
                                encounter_datetime,provider_id,visit_id,encounter.voided,encounter.uuid\n\
                                FROM encounter,encounter_provider WHERE\n\
                                encounter.encounter_id = encounter_provider.encounter_id";
            var query_type = "SELECT encounter_type_id AS id,name,description FROM encounter_type";
            var query_form = "SELECT form_id,name,description FROM form";
            // get all types
            connection.query(query_type, function(error, types, fields) {
                if (!error) {
                    connection.query(query_form, function(error, forms, fields) {
                        if (!error) {
                            // get all encounters
                            connection.query(query_encounters, function(error, encs, fields) {
                                if (!error) {
                                    if (DEBUG) console.log('indexing encounters: ' + encs.length);
                                    for (var a = 0; a < encs.length; a++) {
                                        var encounter = {
                                            id: encs[a].encounter_id,
                                            type: objectType.encounter,
                                            data: {
                                                display : 'encounter ' + encs[a].encounter_datetime,
                                                patient: encs[a].patient_id,
                                                location: encs[a].location_id,
                                                encounterDatetime: encs[a].encounter_datetime,
                                                provider: encs[a].provider_id,
                                                voided: encs[a].voided,
                                                encounterType: {},
                                                form: {}
                                            }
                                        };
                                        // fetch type
                                        for (var b = 0; b < types.length; b++)
                                        if (types[b].encounter_type_id === encs[a].encounter_type) encounter.data.encounterType = types[b];
                                        // fetch form
                                        for (var c = 0; c < forms.length; c++)
                                        if (forms[c].form_id === encs[a].form_id) encounter.data.form = forms[c];
                                        searchserver.index(indexName, indexType, encounter).on('data', function(data) {}).exec();
                                    }
                                    if (callback) callback(true);
                                } else callback(false);
                            });
                        } else callback(false);
                    });
                } else callback(false);
            });
        };
        
        
    var prepareConceptName = function(callback) {
        var query_name = "SELECT concept_id,name,locale,uuid FROM concept_name";
        connection.query(query_name, function(error, names, fields) {
            if (!error) {
                if (DEBUG) console.log('indexing concept_names: ' + names.length);
                var total = 0;
                names.forEach(function(item) {
                    var name = {
                        id : item.concept_id,
                        type : objectType.concept_name,
                        data : {
                            name : item.name,
                            locale : item.locale,
                            uuid : item.uuid
                        }
                    };
                    searchserver.index(indexName, indexType, name).on('data', function(data) {}).exec();
                    total++;
                    if (total === names.length) callback(true);
                });
            }
            else callback(false);
        });
    };
    
    var prepareConceptSet = function(callback) {
        var query_set = "SELECT concept_id,concept_set AS conceptSet,sort_weight AS sortWeight,uuid FROM concept_set";
        connection.query(query_set, function(error, sets, fields) {
            if (!error) {
                if (DEBUG) console.log('indexing concept_sets: ' + sets.length);
                var total = 0;
                sets.forEach(function(item) {
                    var set = {
                        id : item.concept_id,
                        type : objectType.concept_set,
                        data : {
                            conceptSet : item.conceptSet,
                            sortWeight : item.sortWeight,
                            uuid : item.uuid
                        }
                    };
                    searchserver.index(indexName, indexType, set).on('data', function(data) {}).exec();
                    total++;
                    if (total === sets.length) callback(true);
                });
            }
            else callback(false);
        });
    };
    
    var prepareConceptDescription = function(callback) {
        var query_desc = "SELECT concept_id,description,locale,uuid FROM concept_description";
        connection.query(query_desc, function(error, descs, fields) {
            if (!error) {
                if (DEBUG) console.log('indexing concept_descriptions: ' + descs.length);
                var total = 0;
                descs.forEach(function(item) {
                    var desc = {
                        id : item.concept_id,
                        type : objectType.concept_description,
                        data : {
                            description : item.description,
                            locale : item.locale,
                            uuid : item.uuid
                        }
                    };
                    searchserver.index(indexName, indexType, desc).on('data', function(data) {}).exec();
                    total++;
                    if (total === descs.length) callback(true);
                });
            }
            else callback(false);
        });
    };

    var prepareConcepts = function(callback) {
            var query_concept = "SELECT concept_id,uuid,retired,short_name,version,datatype_id,class_id FROM concept";
            var query_datatype = "SELECT concept_datatype_id AS id,name,description FROM concept_datatype";
            var query_class = "SELECT concept_class_id AS id,name,description FROM concept_class";
            // get all types
            connection.query(query_datatype, function(error, types, fields) {
                if (!error) {
                    // get all answers
                    connection.query(query_class, function(error, classes, fields) {
                        if (!error) {
                            // get all classes
                            connection.query(query_concept, function(error, cons, fields) {
                                if (!error) {
                                    if (DEBUG) console.log('indexing concepts: ' + cons.length);
                                    var total = 0;
                                    cons.forEach(function(item) {
                                        var c = {
                                            id: item.concept_id,
                                            type: objectType.concept,
                                            additional : item.short_name,
                                            data: {
                                                uuid: item.uuid,
                                                display : 'concept ' + item.short_name,
                                                name: item.short_name,
                                                retired: item.retired,
                                                version: item.version,
                                                conceptClass: {},
                                                datatype: {}
                                            }
                                        };
                                        // fetch class
                                        for (var b = 0; b < classes.length; b++)
                                        if (classes[b].id === item.class_id) c.data.conceptClass = classes[b];
                                        // fetch datatype
                                        for (var d = 0; d < types.length; d++)
                                        if (types[d].id === item.datatype_id) c.data.datatype = types[d];
                                        searchserver.index(indexName, indexType, c).on('data', function(data) {}).exec();
                                        total++;
                                        if (total === cons.length) 
                                            prepareConceptDescription(function(result) {
                                                prepareConceptName(function(result){
                                                    prepareConceptSet(function(result){
                                                        callback(true);
                                                    });
                                                });
                                            });
                                    });
                                } else callback(false);
                            });
                        } else callback(false);
                    });
                } else callback(false);
            });
        };

    var prepareDrugs = function(callback) {
            var query_drug = "SELECT drug_id AS id,uuid,name,retired,dosage_form,dose_strength,maximum_daily_dose,\n\
                            minimum_daily_dose,units,concept_id,combination,route FROM drug";
            // get all drugs
            connection.query(query_drug, function(error, drugs, fields) {
                if (!error) {
                    if (DEBUG) console.log('indexing drugs: ' + drugs.length);
                    for (var a = 0; a < drugs.length; a++) {
                        var drug = {
                            id: drugs[a].id,
                            type: objectType.drug,
                            additional : drugs[a].name,
                            data: {
                                uuid: drugs[a].uuid,
                                display: "drug " + drugs[a].name,
                                name: drugs[a].name,
                                retired: drugs[a].retired,
                                dosageForm: drugs[a].dosage_form,
                                doseStrength: drugs[a].dose_strength,
                                maximumDailyDose: drugs[a].maximum_daily_dose,
                                minimumDailyDose: drugs[a].minimum_daily_dose,
                                units: drugs[a].units,
                                concept: drugs[a].concept_id,
                                combination: drugs[a].combination,
                                route: drugs[a].route
                            }
                        };
                        searchserver.index(indexName, indexType, drug).on('data', function(data) {}).exec();
                    }
                    if (callback) callback(true);
                } else callback(false);
            });
        };
        
    /* Function for checking, is it uuid or not
     * 
     * @param {type} data - uuid
     * @returns {boolean} - is is uuid or not
     */
    var uuid = function(data) {
        // basically only length will be checked
        return data.length === 36;
    };
    
    /* Query class - class for preparing search queries
     * 
     * @param {type} data - data for searching
     * @returns {ElasticSearch.Query}
     */
    function Query(data) {
        this.q = {
            "query": {
                "filtered" : {
                    "query" : {
                        "query_string" : {
                            fields : [],
                            "query" : data
                        }
                    }
                }
            }
        };
        
        /* Add field for searching 
         * 
         * @param {type} field - field, which add to query
         */
        this.addField = function(field) {
            this.q.query.filtered.query.query_string.fields.push(field);
        };
        
        /* Add filter to query 
         * 
         * @param {type} type - name of the filter field
         * @param {type} data - value for filtering
         * @returns {undefined}
         */
        this.addFilter = function(type,data) {
            if (!this.q.query.filtered.filter) {
                this.q.query.filtered['filter'] = {
                    "query" : {
                        field : {}
                    }
                };
                this.q.query.filtered.filter.query.field[type] = data;
            }
        };
    };

    /* Function for getting data from search server
     * 
     * @param {type} query - query for searching
     * @param {type} data - data for searching
     * @param {type} callback  -function for returning result
     */
    var getData = function(query, callback) {
            searchserver.search(indexName, indexType, query, function(err, data) {
                var out = {
                    result : searchResult.error,
                    data : {}
                };
                var json = JSON.parse(data);
                if ((!err) && (!json.error) && (json.hits)) {
                    out.result = searchResult.ok;
                    out.data = json.hits;
                }
                if (callback) callback(out);
            });
    };
    
    /* Get resulting data by value of its field, and choosen type
     * 
     * @param {type} type - type of object for searching
     * @param {type} field - name of the field
     * @param {type} value - requested value of the field
     * @param {type} callback - function for returning data
     */
    var getDataByField = function(type,field,value,callback) {
        var query = new Query(value);
        query.addField(field);
        query.addFilter('type',type);
        getData(query.q,function(value){
            if (DEBUG) console.log('get data of type <' + type + '>, length: ' + value.data.length);
            if ((value.result === searchResult.ok) && (value.data.total > 0)) {
                // if there is one element 
                if (value.data.hits.length === 1) callback(value.data.hits[0]._source.data);
                // if there are multiple elements
                else {
                    var total = 0;
                    var result = [];
                    // check each element of array
                    value.data.hits.forEach(function(item){
                        if (item) result.push(item._source.data);
                        total++;
                        // if we check all elements - return resulting array
                        if (total === value.data.hits.length) callback(result);
                    });
                }
            }
            // if we get nothing, or error during search - return null
            else callback(null);
        });
    };
    
    /*
     * Functions for getting data of selected type
     * Resulting object:
     * 
     * result : {
     *      result : type of result,
     *      data : result data
     *      id : id of each data element
     * }
     */

    /* Get array of persons
     * 
     * @param {type} data - values for searching
     * @param {type} callback - function for returning data
     */
    var getPersons = function(d, callback) {
            if (DEBUG) console.log('get persons');
            // if search value is uuid = search for first 8 symbols
            if (uuid(d)) d = d.substring(0,8);
            var result = {
                result: {},
                data: [],
                id: []
            };
            // prepare query for search persons
            var query = new Query(d);
            query.addField('uuid');
            query.addField('givenName');
            query.addField('middleName');
            query.addField('familyName');
            query.addFilter('type',objectType.person);
            getData(query.q,function(value) {
                if (DEBUG) console.log('result: ' + value.result);
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

    /* Get array of patients
     * 
     * @param {type} data - values for searching
     * @param {type} callback - function for returning data
     */
    var getPatients = function(data, callback) {
            if (DEBUG) console.log('get patients');
            // get persons according to uuid/name
            getPersons(data, function(res) {
                var result = {
                    result: res.result,
                    data: [],
                    id: []
                };
                if ((res.result === searchResult.ok) && (res.data.length > 0)){
                    async.each(res.id,function(id,callback){
                        var index = res.id.indexOf(id);
                        getDataByField(objectType.patient,'id',id,function(patient){
                            if (patient) {
                                // if there is double-indexed values
                                if (patient.length > 1) {
                                    patient[0].person = res.data[index];
                                    result.data.push(patient[0]);
                                }
                                // if there are single result
                                else {
                                    patient.person = res.data[index];
                                    result.data.push(patient);
                                }
                                result.id.push(id);
                            }
                            callback();
                        });
                    },function(err,res){
                        callback(result);
                    });
                } 
                else {
                    result.result = res.result;
                    callback(result);
                }
            });
    };
    
    /* Get array of providers
     * 
     * @param {type} data - values for searching
     * @param {type} callback - function for returning data
     */
    var getProviders = function(data,callback) {
        if (DEBUG) console.log('get providers');
        // if search value is uuid = search for first 8 symbols
        if (uuid(data)) data = data.substring(0,8);
        var result = {
            result: {},
            data: [],
            id: []
        };
        var query = new Query(data);
        query.addField('uuid');
        query.addField('data.name');
        query.addFilter('type',objectType.provider);
        // get all providers
        getData(query.q, function(value) {
            // if there was no error, and we get data
            if ((value.result === searchResult.ok) && (value.data.total > 0)) {
                async.each(value.data.hits,function(provider,callback){
                    if (provider) {
                        getDataByField(objectType.person,'id',provider._source.data.person,function(person) {
                            provider._source.data.person = person;
                            result.data.push(provider._source.data);
                            result.id.push(provider._source.id);
                            callback();
                        });
                    }
                    else callback();
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
    
    /* Get array of encounters
     * 
     * @param {type} data - data for searching 
     * @param {type} callback - function for returning result
     * @returns {undefined}
     */
    var getEncounters = function(data,callback) {
        if (DEBUG) console.log('get encounters');
        // prepare uuid for searching
        if (uuid(data)) data = data.substring(0,8);
        // resulting object
        var result = {
            result: {},
            data: [],
            id: []
        };
        async.parallel([
            // searching by patient
            function(callback) {
                // trying to get all patients according to request
                getPatients(data,function(val) {
                    // if there was no error, and we get data
                    if ((val.result === searchResult.ok) && (val.data.length > 0)){
                        // async check each patient
                        async.each(val.data,function(patient,callback) {
                            var index = val.data.indexOf(patient);
                            // prepare search query by 'id' field of patient
                            var query_enc = new Query(val.id[index]);
                            query_enc.addField('patient');
                            query_enc.addFilter('type',objectType.encounter);
                            // get all encounters with person_id = patient_id which we found
                            getData(query_enc.q, function(value) {
                                // if there was no error, and we get data
                                if ((value.result === searchResult.ok) && (value.data.total > 0)) {
                                    // async check each encounter
                                    async.each(value.data.hits,function(enc,callback){
                                        // fetch patient for each obs
                                        enc._source.data.patient = patient;
                                        // perform parallel fetching additional fields
                                        async.parallel([
                                            function(callback) {
                                                // get location
                                                if (enc._source.data.location) {
                                                    getDataByField(objectType.location,'encounter_id',
                                                        enc._source.data.location,function(location){
                                                        enc._source.data.location = location;
                                                        callback();
                                                    });
                                                }
                                                else callback();
                                            },
                                            function(callback) {
                                                // get provider
                                                getDataByField(objectType.provider,'id',
                                                enc._source.data.provider,function(provider){
                                                    enc._source.data.provider = provider;
                                                    callback();
                                                });
                                            },
                                            function(callback) {
                                                // get obs
                                                getDataByField(objectType.obs,'encounter',
                                                enc._source.id,function(obs){
                                                    enc._source.data.obs = obs;
                                                    callback();
                                                });
                                            },
                                            function(callback) {
                                                // get order
                                                getDataByField(objectType.order,'encounter',
                                                enc._source.id,function(order){
                                                    enc._source.data.order = order;
                                                    callback();
                                                });
                                            }
                                        // callback for each.item.item
                                        ],function(err,res){
                                            // prepare result
                                            result.result = value.result;
                                            result.data.push(enc._source.data);
                                            result.id.push(enc._source.id);
                                            callback();
                                        });
                                    // callback for each.item
                                    },function(err){
                                        callback();
                                    });
                                }
                                // callback for each.item
                                else callback();
                            });
                        // callback for each
                        },function(err) {
                            callback();
                        });
                    }
                    else callback();
                });
            },
            // searching by encounter uuid
            function(callback) {
                // make search request by encounter uuid 
                var query = new Query(data);
                query.addField('uuid');
                query.addFilter('type',objectType.encounter);
                getData(query.q, function(value) {
                    // if there was no error, and we get data
                    if ((value.result === searchResult.ok) && (value.data.total > 0)) {
                        async.each(value.data.hits,function(enc,callback){
                            if (enc) {
                                result.data.push(enc._source.data);
                                result.id.push(enc._source.id);
                            }
                            callback();
                        },function(err,res){
                            callback();
                        });
                    }
                    else {
                        result.result = value.result;
                        callback();
                    }
                });
            }
        ],function(err,res){
            callback(result);
        });
    };
  
    /* Get array of drugs
     * 
     * @param {type} data - data for searching
     * @param {type} callback - function for returning result
     * @returns {undefined}
     */
    var getDrugs = function(data,callback) {
        if (DEBUG) console.log('get drug');
        // if search value is uuid = search for first 8 symbols
        if (uuid(data)) data = data.substring(0,8);
        var result = {
            result: {},
            data: [],
            id: []
        };
        var query = new Query(data);
        query.addField('uuid');
        query.addField('data.name');
        query.addFilter('type',objectType.drug);
        // get all drugs
        getData(query.q, function(value) {
            // if there was no error, and we get data
            if ((value.result === searchResult.ok) && (value.data.total > 0)) {
                // check each drug
                async.each(value.data.hits,function(drug,callback){
                    // get concept dy drug.concept
                    getDataByField(objectType.concept,'id',drug._source.data.concept,function(concept) {
                        drug._source.data.concept = concept;
                        result.data.push(drug._source.data);
                        result.id.push(drug._source.id);
                        callback();
                    });
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
    
    /* Get array of locations
     * 
     * @param {type} data - data for searching
     * @param {type} callback - function for returning result
     * @returns {undefined}
     */
    var getLocations = function(data,callback) {
        // if search value is uuid = search for first 8 symbols
        if (uuid(data)) data = data.substring(0,8);
        var result = {
            result: {},
            data: [],
            id: []
        };
        var query = new Query(data);
        query.addField('uuid');
        query.addField('data.name');
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
    
    /* Get array of concepts
     * 
     * @param {type} data - data for searching
     * @param {type} callback - function for returning result
     * @returns {undefined}
     */
    var getConcepts = function(data,callback) {
        var result = {
            result : {},
            data: [],
            id: []
        };
        var query = new Query(data);
        query.addField('uuid');
        query.addField('data.name');
        query.addField('data.conceptClass.name');
        query.addFilter('type',objectType.concept);
        // get concepts
        getData(query.q, function(values) {
            // if there is no error, and we get data
            if ((values.result === searchResult.ok) && (values.data.total > 0)) {
                // check each concept
                async.each(values.data.hits,function(concept,callback){
                    async.parallel([
                        // fetch names
                        function(callback) {
                            getDataByField(objectType.concept_name,'id',concept._source.id,function(names) {
                                concept._source.data.names = names;
                                callback();
                            });
                        },
                        // fetch set
                        function(callback) {
                            getDataByField(objectType.concept_set,'id',concept._source.id,function(set) {
                                concept._source.data.set = set;
                                callback();
                            });
                        },
                        // fetch descriptions
                        function(callback) {
                            getDataByField(objectType.concept_description,'id',concept._source.id,function(descriptions) {
                                concept._source.data.descriptions = descriptions;
                                callback();
                            });
                        }  
                    ],function(err){
                        result.data.push(concept._source.data);
                        result.id.push(concept._source.id);
                        callback();
                    });
                },function(err,res){
                    result.result = values.result;
                    callback(result);
                });
            }
            else {
                result.result = values.result;
                callback(result);
            }
        });
    };
    
    /* Get array of orders
     * 
     * @param {type} data - data for searching 
     * @param {type} callback - function for returning result
     * @returns {undefined}
     */
    var getOrders = function(data,callback) {
        if (uuid(data)) data = data.substring(0,8);
        var result = {
            result: {},
            data: [],
            id: []
        };
        async.parallel([
            // search by patient
            function(callback) {
                getPatients(data,function(val) {
                    if ((val.result === searchResult.ok) && (val.data.length > 0)) {
                        // check each patient
                        async.each(val.data,function(patient,callback){
                            var index = val.data.indexOf(patient);
                            // get orders of patient
                            getDataByField(objectType.order,'patient',val.id[index],function(orders){
                                if (orders) {
                                    // check each order
                                    async.each(orders,function(order,callback){
                                        // fetch patient
                                        order.patient = patient;
                                        // fetch other required fields
                                        async.parallel([
                                            function(callback) {
                                                // fetch concept
                                                getDataByField(objectType.concept,'id',order.concept,function(concept){
                                                    order.concept = concept;
                                                    callback();
                                                });
                                            },
                                            function(callback) {
                                                // fetch encounter
                                                getDataByField(objectType.encounter,'id',order.encounter,function(enc){
                                                    order.encounter = enc;
                                                    callback();
                                                });
                                            }
                                        ],function(err){
                                            result.data.push(order);
                                            result.id.push(val.id[index]);
                                            callback();
                                        });
                                    },function(err,res){
                                         callback();
                                    });
                                }
                                else {
                                    result.result = searchResult.ok;
                                    callback();
                                }
                            });
                        },function(err,res){
                            callback();
                        });
                    } 
                    else {
                        result.result = val.result;
                        callback();
                    }
                });
            // serch by order uuid
            },function(callback) {
                var query = new Query(data);
                query.addField('uuid');
                query.addFilter('type',objectType.order);
                // get orders by uuid
                getData(query.q, function(value) {
                    // if there was no error, and we gat data
                    if ((value.result === searchResult.ok) && (value.data.total > 0)) {
                        async.each(value.data.hits,function(order,callback){
                            // fetch fields
                            async.parallel([
                                function(callback) {
                                    // fetch concept
                                    getDataByField(objectType.concept,'id',order.concept,function(concept){
                                        order.concept = concept;
                                        callback();
                                    });
                                },
                                function(callback) {
                                    // fetch encounter
                                    getDataByField(objectType.encounter,'id',order.encounter,function(enc){
                                        order.encounter = enc;
                                        callback();
                                    });
                                },
                                function(callback) {
                                    // fetch patient
                                    getDataByField(objectType.patient,'id',order.patient,function(pat){
                                        order.patient = pat;
                                        callback();
                                    });
                                }
                            ],function(err){
                                result.data.push(order._source.data);
                                result.id.push(order._source.id);
                                callback();
                            });
                        },function(err,res){
                            result.result = value.result;
                            callback();
                        });
                    }
                    else {
                        result.result = value.result;
                        callback();
                    }
                });
            }
        ],function(err){
            callback(result);
        });
    };
    
    /* Get array of obs
     * 
     * @param {type} data - data for searching 
     * @param {type} callback - function for returning result
     * @returns {undefined}
     */
    var getObs = function(data,callback) {
        // prepare uuid for searching
        if (uuid(data)) data = data.substring(0,8);
        // resulting object
        var result = {
            result: {},
            data: [],
            id: []
        };
        async.parallel([
            // search by patient
            function(callback) {
                getPatients(data,function(val) {
                    if ((val.result === searchResult.ok) && (val.data.length > 0)) {
                        // check each patient
                        async.each(val.data,function(patient,callback){
                            var index = val.data.indexOf(patient);
                            // get obs of patient
                            getDataByField(objectType.obs,'person',val.id[index],function(obs){
                                if (obs) {
                                    // check each obs
                                    async.each(obs,function(ob,callback){
                                        // fetch required fields
                                        async.parallel([
                                            function(callback) {
                                                // fetch concept
                                                getDataByField(objectType.concept,'id',ob.concept,function(concept){
                                                    ob.concept = concept;
                                                    callback();
                                                });
                                            },
                                            function(callback) {
                                                // fetch encounter
                                                getDataByField(objectType.encounter,'id',ob.encounter,function(enc){
                                                    ob.encounter = enc;
                                                    callback();
                                                });
                                            },
                                            function(callback) {
                                                // fetch person
                                                getDataByField(objectType.person,'id',ob.person,function(person){
                                                    ob.person = person;
                                                    callback();
                                                });
                                            },
                                            function(callback) {
                                                // fetch location
                                                getDataByField(objectType.location,'id',ob.location,function(location){
                                                    ob.location = location;
                                                    callback();
                                                });
                                            },
                                            function(callback) {
                                                // fetch order
                                                getDataByField(objectType.order,'id',ob.order,function(order){
                                                    ob.order = order;
                                                    callback();
                                                });
                                            }        
                                        ],function(err){
                                            result.data.push(ob);
                                            result.id.push(val.id[index]);
                                            callback();
                                        });
                                    },function(err,res){
                                         callback();
                                    });
                                }
                                else {
                                    result.result = searchResult.ok;
                                    callback();
                                }
                            });
                        },function(err,res){
                            callback();
                        });
                    } 
                    else {
                        result.result = val.result;
                        callback();
                    }
                });
            // serch by order uuid
            },function(callback) {
                var query = new Query(data);
                query.addField('uuid');
                query.addFilter('type',objectType.obs);
                // get orders by uuid
                getData(query.q, function(value) {
                    // if there was no error, and we gat data
                    if ((value.result === searchResult.ok) && (value.data.total > 0)) {
                        async.each(value.data.hits,function(ob,callback){
                            // fetch fields
                            async.parallel([
                                function(callback) {
                                    // fetch concept
                                    getDataByField(objectType.concept,'id',ob._source.data.concept,function(concept){
                                        ob._source.data.concept = concept;
                                        callback();
                                    });
                                },
                                function(callback) {
                                    // fetch encounter
                                    getDataByField(objectType.encounter,'id',ob._source.data.encounter,function(enc){
                                        ob._source.data.encounter = enc;
                                        callback();
                                    });
                                },
                                function(callback) {
                                    // fetch person
                                    getDataByField(objectType.person,'id',ob._source.data.person,function(person){
                                        ob._source.data.person = person;
                                        callback();
                                    });
                                },
                                function(callback) {
                                    // fetch location
                                    getDataByField(objectType.location,'id',ob._source.data.location,function(location){
                                        ob._source.data.location = location;
                                        callback();
                                    });
                                },
                                function(callback) {
                                    // fetch order
                                    getDataByField(objectType.order,'id',ob._source.data.order,function(order){
                                        ob._source.data.order = order;
                                        callback();
                                    });
                                }     
                            ],function(err){
                                result.data.push(ob._source.data);
                                result.id.push(ob._source.id);
                                callback();
                            });
                        },function(err,res){
                            result.result = value.result;
                            callback();
                        });
                    }
                    else {
                        result.result = value.result;
                        callback();
                    }
                });
            }
        ],function(err){
            callback(result);
        });
    };

    /*
     * Public attributes/methods
     */

    // index selected fields
    this.index = function(callback) {
        var startTime = new Date();
        if (DEBUG) console.log('indexing started');
        preparePersons(function() {
            if (DEBUG) console.log('persons done, time = ' + (new Date() - startTime));
            prepareDrugs(function() {
                if (DEBUG) console.log('drugs done, time = ' + (new Date() - startTime));
                prepareProviders(function() {
                    if (DEBUG) console.log('providers done, time = ' + (new Date() - startTime));
                    prepareLocations(function() {
                        if (DEBUG) console.log('locations done, time = ' + (new Date() - startTime));
                        preparePatients(function() {
                            if (DEBUG) console.log('patients done, time = ' + (new Date() - startTime));
                            prepareProviders(function() {
                                if (DEBUG) console.log('providers done, time = ' + (new Date() - startTime));
                                prepareConcepts(function() {
                                    if (DEBUG) console.log('concepts done, time = ' + (new Date() - startTime));
                                    prepareLocations(function() {
                                        if (DEBUG) console.log('locations done, time = ' + (new Date() - startTime));
                                        preparePatients(function() {
                                            if (DEBUG) console.log('patients done, time = ' + (new Date() - startTime));
                                            prepareEncounters(function() {
                                                if (DEBUG) console.log('enc done, time = ' + (new Date() - startTime));
                                                prepareOrders(function() {
                                                    if (DEBUG) 
                                                        console.log('orders done, time = ' + (new Date() - startTime));
                                                    prepareObs(function() {
                                                        if (DEBUG) 
                                                            console.log('obs done, time = ' + (new Date() - startTime));
                                                        if (callback) callback();
                                                        // update cfg file
                                                        settings.indexed = 'true';
                                                        settings.save();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    };

    // search function
    this.search = function(type, item, data, callback) {
        // check for incorrect data
        if (data === "") {
            var result = {
                result : searchResult.error,
                data : errorType.incorr_data
            };
            callback(result);
        }
        else {
            if (type === searchType.plain) {

            }
            if ((type === searchType.single) && (item)) {
                switch (item) {
                    case objectType.person:
                        getPersons(data, callback);
                        break;
                    case objectType.patient:
                        getPatients(data, callback);
                        break;
                    case objectType.provider:
                        getProviders(data,callback);
                        break;
                    case objectType.drug:
                        getDrugs(data,callback);
                        break;
                    case objectType.location:
                        getLocations(data,callback);
                        break;
                    case objectType.concept:
                        getConcepts(data,callback);
                        break;
                    case objectType.order: 
                        getOrders(data,callback);
                        break;
                    case objectType.obs:
                        getObs(data,callback);
                        break;
                    case objectType.encounter:
                        getEncounters(data,callback);
                        break;
                    default:
                        var result = {
                            result : searchResult.error,
                            data : errorType.unimplemented
                        };
                        callback(result);
                }
            }
        }
    };
    
    if (INDX) this.index();
}
// create new instance of search layer
var es = new ElasticSearch();

http.createServer(function(request, response) {
    if (request.method === "POST") {
        // data buffer
        var data = '';
        // getting data chunks
        request.on('data', function(chunk) {
            data += chunk;
        });
        // all data loaded
        request.on('end', function() {
            // parsing data
            var object = JSON.parse(data);
            es.search(object.type, object.item, object.data, function(result) {
                response.writeHead(200, {
                    'Content-Type': 'x-application/json'
                });
                response.end(JSON.stringify(result));
            });
        });
    } else {
        var filePath = path.join('.', request.url);
        //checking includes
        path.exists(filePath, function(exists) {
            if (exists) {
                var extname = path.extname(filePath);
                var contentType = 'text/html';
                switch (extname) {
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                }
                fs.readFile(filePath, function(error, content) {
                    if (error) {
                        response.writeHead(500);
                        response.end();
                    } else {
                        response.writeHead(200, {
                            'Content-Type': contentType
                        });
                        response.end(content, 'utf-8');
                    }
                });
            } else {
                response.writeHead(404);
                response.end();
            }
        });
    }

}).listen(1024);