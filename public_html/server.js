// include modules
var http = require('http');
var path = require('path');
var fs = require('fs');

// class for search layer
function ElasticSearch() {
    
    /*
     * Private attributes/methods
     */
    
    // mysql module
    var mysql = require("/usr/local/lib/node_modules/mysql");
    // open MySQL connection
    var connection = mysql.createConnection({
        user: "root",
        password: "ermolenko",
        database: "openmrs"
    });
    // create searchserver object
    var ElasticSearchClient = require('/usr/local/lib/node_modules/elasticsearchclient');
    var searchserver = new ElasticSearchClient({
        host:'localhost',
        port:'9200'
    });
    // name for indexing
    var indexname = 'openmrs_test';
    // type of index
    var indextype = 'document';
    
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
        connection.query(query_person_attribute, function (error, attributes, fields) {
            if (!error) {
                // get all names
                connection.query(query_person_name,function (error,names,fields) {
                     if (!error) {
                         // get all adresses
                         connection.query(query_person_address,function(error,addresses,fields) {
                             if (!error) {
                                 // get all persons
                                 connection.query(query_person,function(error,persons,fields) {
                                      if (!error) {
                                          // array for persons
                                          var ps = [];
                                          for (var a=0;a<persons.length;a++) {
                                              var person = {};
                                              person.id = persons[a].person_id;
                                              person.uuid = persons[a].uuid;
                                              person.gender = persons[a].gender;
                                              person.bithdate = persons[a].birthdate;
                                              person.bithdateEstimated = persons[a].birthdate_estimated;
                                              person.dead = persons[a].dead;
                                              person.deathDate = persons[a].death_date;
                                              person.causeOfDeath = persons[a].cause_of_death;
                                              // fetch attributes
                                              person.attributes = [];
                                              for (var b=0;b<attributes.length;b++) 
                                                  if (attributes[b].person_id === persons[a].person_id) 
                                                      person.attributes.push(attributes[b]);
                                              // fetch preferredName
                                              for (var d=0;d<names.length;d++) 
                                                  if (names[d].person_id === persons[a].person_id)
                                                      person.preferredName = names[d];
                                              // fetch preferredAddress
                                              for (var e=0;e<addresses.length;e++) 
                                                  if (addresses[e].person_id === persons[a].person_id) 
                                                      person.preferredAddress = addresses[e];
                                              ps.push(person);
                                          }
                                          // return persons
                                          if (callback) callback(ps);
                                      }
                                 });
                              }
                         });
                     }
                });
            }
            
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
        connection.query(query_identifier, function (error, identifiers, fields) {
            if (!error) {
                // get all patients
                connection.query(query_patient, function (error, pats, fields) {
                    if (!error) {
                        // get all persons
                        connection.query(query_person,function(error,persons,fields) {
                            if (!error) {
                                var patients = [];
                                for (var a=0;a<pats.length;a++) {
                                    var patient = {};
                                    patient.id = pats[a].patient_id;
                                    patient.voided = pats[a].voided;
                                    patient.identifiers = [];
                                    // fetch identifiers
                                    for (var z=0;z<identifiers.length;z++) 
                                        if (identifiers[z].patient_id === pats[a].patient_id)
                                            patient.identifiers.push(identifiers[z]);
                                    // fetch uuid
                                    for (var b=0;b<persons.length;b++)
                                        if (persons[b].person_id === pats[a].patient_id)
                                            patient.uuid = persons[b].uuid;
                                    patients.push(patient);
                                }
                                // return patients
                                if (callback) callback(patients);
                            }
                        });
                    }
                });
            }
        });
    };
    
    // prepare array of providers
    var prepareProviders = function(callback) {
        var query_attribute = "SELECT provider_id,value_reference AS valueReference,name,description,datatype FROM \n\
                            provider_attribute,provider_attribute_type WHERE \n\
                            provider_attribute.attribute_type_id = provider_attribute_type.provider_attribute_type_id";
        var query_provider = "SELECT provider_id,person_id,name,identifier,retired,uuid FROM provider";
        connection.query(query_attribute, function (error, attributes, fields) {
            if (!error) {
                connection.query(query_provider, function (error, provs, fields) {
                    if (!error) {
                        var providers = [];
                        for (var a=0;a<provs.length;a++) {
                            var provider = {};
                            provider.id = provs[a].provider_id;
                            provider.name = provs[a].name;
                            provider.uuid = provs[a].uuid;
                            provider.identifier = provs[a].identifier;
                            provider.retired = provs[a].retired;
                            provider.attributes = [];
                            provider.person = provs[a].person_id;
                            // fetch attributes
                            for (var b=0;b<attributes.length;b++) if (attributes[b].provider_id === provs[a].provider_id) 
                                provider.attributes.push(attributes[b]);
                            providers.push(provider);
                        }
                        // return providers
                        if (callback) callback(providers);
                    }
                });
            }
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
        connection.query(query_tag, function (error, tags, fields) {
            if (!error) {
                // get all attributes
                connection.query(query_attribute, function (error, attributes, fields) {
                    if (!error) {
                        // get all locations
                        connection.query(query_location, function (error, locs, fields) {
                            if (!error) {
                                var locations = [];
                                for (var a=0;a<locs.length;a++) {
                                    var location = {};
                                    location.id = locs[a].location_id;
                                    location.name = locs[a].name;
                                    location.uuid = locs[a].uuid;
                                    location.description = locs[a].description;
                                    location.address1 = locs[a].address1;
                                    location.address2 = locs[a].address2;
                                    location.address3 = locs[a].address3;
                                    location.address4 = locs[a].address4;
                                    location.address5 = locs[a].address5;
                                    location.address6 = locs[a].address6;
                                    location.cityVillage = locs[a].city_village;
                                    location.stateProvince = locs[a].state_province;
                                    location.country = locs[a].country;
                                    location.postalCode = locs[a].postal_code;
                                    location.latitude = locs[a].latitude;
                                    location.longitude = locs[a].longitude;
                                    location.countyDistrict = locs[a].county_district;
                                    location.tags = [];
                                    location.attributes = [];
                                    // fetch tags
                                    for (var b=0;b<tags.length;b++) if (tags[b].location_id === locs[a].location_id)
                                        location.tags.push(tags[b]);
                                    // fetch attributes
                                    for (var c=0;c<attributes.length;c++) 
                                        if (attributes[c].location_id === locs[a].location_id)
                                            location.attributes.push(attributes[c]);
                                    locations.push(location);
                                }
                                // return locations
                                if (callback) callback(locations);
                            }
                        });
                    }
                });
            }
        });
    };
    
    var prepareObs = function(callback) {
        var query_obs = "SELECT obs_id,uuid,person_id,concept_id,encounter_id,order_id,obs_datetime,\n\
                        value_modifier,accession_number,obs_group_id,value_coded_name_id,comments,location_id,\n\
                        voided,value_complex FROM obs";
        connection.query(query_obs, function (error, obss, fields) {
            if (!error) {
                var obs_arr = [];
                for (var a=0;a<obss.length;a++) {
                    var obs = {};
                    obs.uuid = obss[a].uuid;
                    obs.id = obss[a].obs_id;
                    obs.person = obss[a].person_id;
                    obs.concept = obss[a].concept_id;
                    obs.location = obss[a].location_id;
                    obs.order = obss[a].order_id;
                    obs.value = obss[a].value_complex;
                    obs.valueModifier = obss[a].value_modifier;
                    obs.obsDatetime = obss[a].obs_datetime;
                    obs.accessionNumber = obss[a].accession_number;
                    obs.obsGroup = obss[a].obs_group_id;
                    obs.valueCodedName = obss[a].value_coded_name;
                    obs.value = obss[a].value_complex;
                    obs.location = obss[a].location_id;
                    obs.comment = obss[a].comments;
                    obs.voided = obss[a].voided;
                    obs_arr.push(obs);
                }
                // return obs
                if (callback) callback(obs_arr);
            }
        });
    };
    
    var prepareOrders = function(callback) {
        var query_orders = "SELECT order_id,concept_id,patient_id,instructions,start_date,auto_expire_date,\n\
                            orderer,encounter_id,accession_number,discontinued_by,discontinued_date,\n\
                            discontinued_reason,order_type_id,uuid FROM orders,encounter WHERE \n\
                            encounter.encounter_id = orders.encounter_id";
        var query_type = "SELECT order_type_id AS id,name,desription FROM order_type";
        // get all types
        connection.query(query_type, function (error, types, fields) {
            if (!error) {
                // get all orders
                connection.query(query_orders, function (error, values, fields) {
                    if (!error) {
                        var orders = [];
                        for (var a=0;a<values.length;a++) {
                            var order = {};
                            order.id = values[a].order_id;
                            order.patient = values[a].patient_id;
                            order.concept = values[a].concept_id;
                            order.instructions = values[a].instructions;
                            order.startDate = values[a].start_date;
                            order.autoExpireDate = values[a].auto_expire_date;
                            order.encounter = values[a].encounter_id;
                            order.orderer = values[a].orderer;
                            order.accessionNumber = values[a].accession_number;
                            order.discontinuedBy = values[a].discntinued_by;
                            order.discontinuedDate = values[a].discntinued_date;
                            order.discontinuedReason = values[a].discntinued_reason;
                            // fetch orderType
                            for (var b=0;b<types.length;b++)
                                if (types[b].id === values[a].order_type_id)
                                    order.orderType = types[b];
                            orders.push(order);
                        }
                        // return orders
                        if (callback) callback(orders);
                    }
                });
            }
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
        connection.query(query_type, function (error, types, fields) {
            if (!error) {
                connection.query(query_form,function (error,forms,fields){
                    if (!error) {
                        // get all encounters
                        connection.query(query_encounters, function (error, encs, fields) {
                             if (!error) {
                                  var encounters = [];
                                  for (var a=0;a<encs.length;a++) {
                                       var encounter = {};
                                       encounter.id = encs[a].encounter_id;
                                       encounter.patient = encs[a].patient_id;
                                       encounter.location = encs[a].location_id;
                                       encounter.encounterDatetime = encs[a].encounter_datetime;
                                       encounter.provider = encs[a].provider_id;
                                       encounter.voided = encs[a].voided;
                                       // fetch type
                                       for (var b=0;b<types.length;b++)
                                           if (types[b].encounter_type_id === encs[a].encounter_type)
                                               encounter.encounterType = types[b];
                                       // fetch form
                                       for (var c=0;c<forms.length;c++)
                                           if (forms[c].form_id === encs[a].form_id)
                                               encounter.form = forms[c];
                                       encounters.push(encounter);
                                   }
                                   // return encounters
                                   if (callback) callback(encounters);
                              }
                        });
                    }
                });
            }
        });
    };
    
    var prepareConcepts = function(callback) {
        var query_concept = "SELECT concept_id,uuid,retired,short_name,version,datatype_id,class_id FROM concept";
        var query_datatype = "SELECT concept_datatype_id AS id,name,description FROM concept_datatype";
        var query_answer = "SELECT concept_id,answer_concept AS answerConcept,\n\
                            answer_drug AS answerDrug FROM concept_answer";
        var query_class = "SELECT concept_class_id AS id,name,description FROM concept_class";
        var query_set = "SELECT concept_id,concept_set AS conceptSet,sort_weight AS sortWeight FROM concept_set";
        var query_name = "SELECT concept_id,name,locale FROM concept_name";
        // get all types
        connection.query(query_datatype, function (error, types, fields) {
            if (!error) {
                // get all answers
                connection.query(query_answer, function (error, answers, fields) {
                    if (!error) {
                        // get all classes
                        connection.query(query_class, function (error, classes, fields) {
                            if (!error) {
                                // get all sets
                                connection.query(query_set, function (error, sets, fields) {
                                    if (!error) {
                                        // get all names
                                        connection.query(query_name, function (error, names, fields) {
                                            if (!error) {
                                                // get all concepts
                                                connection.query(query_concept, function (error, cons, fields) {
                                                    if (!error) {
                                                        var concepts = [];
                                                        for (var a=0;a<cons.length;a++) {
                                                            var c = {};
                                                            c.id = cons[a].concept_id;
                                                            c.uuid = cons[a].uuid;
                                                            c.name = cons[a].short_name;
                                                            c.retired = cons[a].retired;
                                                            c.version = cons[a].version;
                                                            // fetch class
                                                            for (var b=0;b<classes.length;b++)
                                                                if (classes[b].id === cons[a].class_id)
                                                                    c.conceptClass = classes[b];
                                                            // fetch datatype
                                                            for (var d=0;d<types.length;d++)
                                                                if (types[d].id === cons[a].datatype_id)
                                                                    c.datatype = types[d];
                                                            // fetch set
                                                            c.set = [];
                                                            for (var e=0;e<sets.length;e++)
                                                                if (sets[e].concept_id === cons[a].concept_id)
                                                                    c.set.push(sets[e]);
                                                            // fetch names
                                                            c.names = [];
                                                            for (var f=0;f<names.length;f++)
                                                                if (names[f].concept_id === cons[a].concept_id)
                                                                    c.names.push(names[f]);
                                                            // fetch answers
                                                            c.answers = []
                                                            for (var g=0;g<answers.length;g++)
                                                                if (answers[g].concept_id === cons[a].concept_id)
                                                                    c.answers.push(answers[g]);
                                                            // ELSE mappings,description
                                                            concepts.push(c);
                                                        }
                                                        // return concepts
                                                        if (callback) callback(concepts);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
        
    };
    
    var prepareDrugs = function (callback) {
        var query_drug = "SELECT drug_id AS id,uuid,name,retired,dosage_form AS dosageForm,\n\
                            dose_strength AS doseStrength,maximum_daily_dose AS maximumDailyDose,\n\
                            minimum_daily_dose AS minimumDailyDose,units,concept_id AS concept,\n\
                            combination,route FROM drug";
        // get all drugs
        connection.query(query_drug, function (error, drugs, fields) {
           if (!error) {
               // return drugs
               if (callback) callback(drugs);
           }
        });
    };
    
    /*
     * Public attributes/methods
     */
    
    // index selected fields
    this.index = function(callback) {
        preparePersons(function(persons) {
            // index each person
            for (var a=0;a<persons.length;a++) searchserver.index(indexname,indextype,persons[a]).exec();
        });
        prepareDrugs(function(drugs) {
            // index each drug
            for (var a=0;a<drugs.length;a++) searchserver.index(indexname,indextype,drugs[a]).exec();
                //console.log(drugs[a]);
        });
        prepareEncounters(function(encounters) {
            // index each encounter
            for (var a=0;a<encounters.length;a++) searchserver.index(indexname,indextype,encounters[a]).exec();
                //console.log(encounters[a])
        });
        prepareObs(function(obs) {
            // index each obs
            for (var a=0;a<obs.length;a++) searchserver.index(indexname,indextype,obs[a]).exec();
               // console.log(obs[a])
        });
        prepareOrders(function(orders){
            // index each order
            for (var a=0;a<orders.length;a++) searchserver.index(indexname,indextype,orders[a]).exec();
        });
        preparePatients(function(patients) {
            // index each patient
            for (var a=0;a<patients.length;a++) searchserver.index(indexname,indextype,patients[a]).exec();
        });
        prepareConcepts(function(concepts) {
            // index each concept
            for (var a=0;a<concepts.length;a++) searchserver.index(indexname,indextype,concepts[a]).exec();
        });
        prepareLocations(function(locs){
            // index each location
            for (var a=0;a<locs.length;a++) searchserver.index(indexname,indextype,locs[a]).exec();
        });
        prepareProviders(function(providers){
            // index each provider
            for (var a=0;a<providers.length;a++) searchserver.index(indexname,indextype,providers[a]).exec();
        });
    };
    // search 
    this.search = function(type,data,callback) {
        if (type === "plain") {
            var que = {
                "query": {
                    "query_string": {
                        "query":data
                     }
                }
            };
            searchserver.search(indexname, indextype, que, function(err, data) {
                if ((!err) && (callback)) callback(data);
            });
        }
    };
}

var es = new ElasticSearch();
es.index();

http.createServer(function (request, response) {
    if (request.method === "POST") {
       // data buffer
       var data = '';
       // getting data chunks
       request.on('data', function (chunk) {
          data += chunk;
       });
       // all data loaded
       request.on('end', function () {
           // parsing data
           var object = JSON.parse(data);
           es.search(object.type,object.data,function(result) {
               response.writeHead(200, {'Content-Type': 'x-application/json'});
               response.end(JSON.stringify(result));
           });
       });
    }
    
    else {
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
                    }
                    else {
                        response.writeHead(200, {'Content-Type': contentType});
                        response.end(content, 'utf-8');
                    }
                });
            }
            else {
                response.writeHead(404);
                response.end();
            }
        });
    }
    
}).listen(1024);


