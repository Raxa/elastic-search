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
        var query_person_name = "select person_id,given_name,family_name,middle_name from person_name";
        var query_person_address = "select person_id,address1,address2,city_village,state_province,\n\
                            postal_code,country from person_address";
        var query_person_attribute = "select person_id,value,name,description,\n\
                            format,searchable from person_attribute,person_attribute_type where \n\
                            person_attribute.person_attribute_type_id=person_attribute_type.person_attribute_type_id";
        var query_person = "select person_id,uuid,gender,birthdate,birthdate_estimated,\n\
                            dead,death_date,cause_of_death,voided from person";
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
                                          var pids = [];
                                          for (var a=0;a<persons.length;a++) {
                                              var person = {};
                                              person.uuid = persons[a].uuid;
                                              person.gender = persons[a].gender;
                                              person.bithdate = persons[a].birthdate;
                                              person.bithdateEstimated = persons[a].birthdate_estimated;
                                              person.dead = persons[a].dead;
                                              person.deathDate = persons[a].death_date;
                                              person.causeOfDeath = persons[a].cause_of_death;
                                              person.attributes = [];
                                              for (var b=0;b<attributes.length;b++) 
                                                  if (attributes[b].person_id === persons[a].person_id) 
                                                      person.attributes.push(attributes[b]);
                                              ps.push(person);
                                              pids.push(persons[a].person_id);
                                          }
                                          // return persons
                                          if (callback) callback(ps,pids);
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
    var preparePatients = function(persons,ppids,callback) {
        var query_patient = "select patient_id,voided from patient";
        var query_identifier = "select patient_id,identifier,name,description,format,voided from \n\
                        patient_identifier,patient_identifier_type where patient_identifier.identifier_type =\n\
                        patient_identifier_type.patient_identifier_type_id";
        connection.query(query_identifier, function (error, identifiers, fields) {
            if (!error) {
                connection.query(query_patient, function (error, pats, fields) {
                    var patients = [];
                    var pids = [];
                    for (var a=0;a<pats.length;a++) {
                        var patient = {};
                        var index = ppids.indexOf(pats[a].patient_id);
                        patient.person = persons[index];
                        patient.uuid = persons[index].uuid;
                        patient.voided = pats[a].voided;
                        patient.identifiers = [];
                        for (var z=0;z<identifiers.length;z++) if (identifiers[z].patient_id === pats[a].patient_id)
                            patient.identifiers.push(identifiers[z]);
                        patients.push(patient);
                        pids.push(pats[a].patient_id);
                    }
                    // return patients
                    if (callback) callback(patients,pids);
                });
            }
        });
    };
    
    /*
     * Public attributes/methods
     */
    
    // index selected fields
    this.index = function(callback) {
        // prepare array of persons
        preparePersons(function(persons,pids) {
            // index each person
            for (var a=0;a<persons.length;a++) searchserver.index(indexname,indextype,persons[a]).exec();
            // prepare array of patients
            preparePatients(persons,pids,function(patients,patient_pids){
                // index each patient
                for (var b=0;b<patients.length;b++) searchserver.index(indexname,indextype,patients[b]).exec();
            });
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


