//var exec = require('child_process').exec;
var request = require('request');
var crypto = require('crypto');

var Module = require('../lib/module').Module;

module = new Module();

describe('jasmine-node', function() {

    /*
     * 
     *  Data for testing
     *  We will add user0, which have access:
     *  GRANTED : persons, patients, orders, encounters and drugs ; 
     *  RESTRICTED : locations, concepts, obs, providers;
     *  ACCSESS GROUPS : 1;
     *  
     */

    var test, child;
    // optional login and pass
    var login = 'test';
    var pass = 'test';
    var sha512 = crypto.createHash('sha512');
    sha512.update(pass + '3eff1aa4363beab41', 'utf8');
    var p = sha512.digest('hex');
    // USERS
    var user0_0 = {
        type: 'user',
        _id: 'user_1',
        data: {
            user: 'test',
            pass: p,
            salt: '3eff1aa4363beab41',
            role: 'person',
            privilege: 'View People',
            person: 1
        }
    };

    var user0_1 = {
        type: 'user',
        _id: 'user_2',
        data: {
            user: 'test',
            pass: p,
            salt: '3eff1aa4363beab41',
            role: 'person',
            privilege: 'View Patients',
            person: 1
        }
    };

    var user0_2 = {
        type: 'user',
        _id: 'user_3',
        data: {
            user: 'test',
            pass: p,
            salt: '3eff1aa4363beab41',
            role: 'person',
            privilege: 'View Orders',
            person: 1
        }
    };

    var user0_3 = {
        type: 'user',
        _id: 'user_4',
        data: {
            user: 'test',
            pass: p,
            salt: '3eff1aa4363beab41',
            role: 'person',
            privilege: 'View Encounters',
            person: 1
        }
    };

    var user0_4 = {
        type: 'user',
        _id: 'user_5',
        data: {
            user: 'test',
            pass: p,
            salt: '3eff1aa4363beab41',
            role: 'person',
            privilege: 'View Drug Info',
            person: 1
        }
    };

    // USER_ACCESS

    // access group with id = 1
    var access0 = {
        _id: 'acc_1',
        type: 'user_access',
        data: {
            id: 1,
            person: 1
        }
    };

    // access group with id = 2
    var access1 = {
        _id: 'acc_2',
        type: 'user_access',
        data: {
            id: 2,
            person: 2
        }
    };

    var resource0 = {
        _id: 'res_1',
        type: 'user_resource',
        data: {
            id: 1,
            person: 1
        }
    };

    var resource1 = {
        _id: 'res_2',
        type: 'user_resource',
        data: {
            id: 2,
            person: 2
        }
    };

    // PERSONS
    var person0 = {
        _id: 'per_1',
        id: 1,
        type: 'person',
        tags: {
            name1: 'Andriy',
            name2: 'Victorovich',
            name3: 'Ermolenko',
            uuid: 'fc817116-1e25-470b-8037-b2c8dfe1ecea'
        },
        data: {
            preferredName: {
                givenName: 'Andriy',
                middleName: 'Victorovich',
                familyName: 'Ermolenko'
            }
        }
    };

    var person1 = {
        _id: 'per_2',
        id: 2,
        type: 'person',
        tags: {
            name1: 'Vasiliy',
            name2: 'Nesterovich',
            name3: 'Kashuk',
            uuid: 'fc812324-1e25-470b-8037-b2c8dfe1ecea'
        },
        data: {
            uuid: 'fc812324-1e25-470b-8037-b2c8dfe1ecea',
            preferredName: {
                givenName: 'Vasiliy',
                middleName: 'Nesterovichh',
                familyName: 'Kashuk'
            }
        }
    };

    //PATIENTS
    var patient0 = {
        _id: 'pat_1',
        id: 1,
        type: 'patient',
        tags: {
            name1: 'Andriy',
            name2: 'Victorovich',
            name3: 'Ermolenko',
            uuid: 'fc817116-1e25-470b-8037-b2c8dfe1ecea'
        },
        data: {
            uuid: 'fc817116-1e25-470b-8037-b2c8dfe1ecea'
        }
    };

    var patient1 = {
        _id: 'pat_2',
        id: 2,
        type: 'patient',
        tags: {
            name1: 'Vasiliy',
            name2: 'Nesterovich',
            name3: 'Kashuk',
            uuid: 'fc812324-1e25-470b-8037-b2c8dfe1ecea'
        },
        data: {
            uuid: 'fc812324-1e25-470b-8037-b2c8dfe1ecea'
        }
    };
    // PROVIDERS
    var provider0 = {
        _id: 'pro_1',
        type: 'provider',
        tags: {
            name: 'abc',
            uuid: '6a518a00-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a00-0597-47eb-94c0-f72175389d3b'
        }
    };

    var provider1 = {
        _id: 'pro_2',
        type: 'provider',
        tags: {
            name: 'def',
            uuid: '6a518a01-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a01-0597-47eb-94c0-f72175389d3b'
        }
    };

    // ORDERS
    var order0 = {
        _id: 'ord_1',
        type: 'order',
        tags: {
            name1: 'Andriy',
            name2: 'Victorovich',
            name3: 'Ermolenko',
            uuid: '6a518a02-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a02-0597-47eb-94c0-f72175389d3b',
            display: 'order',
            patient: 1
        }
    };

    var order1 = {
        _id: 'ord_2',
        type: 'order',
        tags: {
            name1: 'Serhiy',
            name2: 'Oleksiyovich',
            name3: 'Yuschecnko',
            uuid: '6a518a03-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a03-0597-47eb-94c0-f72175389d3b',
            display: 'order',
            patient: 1
        }
    };
    //ENCOUNTERS
    var enc0 = {
        _id: 'enc_1',
        type: 'encounter',
        tags: {
            name1: 'Andriy',
            name2: 'Victorovich',
            name3: 'Ermolenko',
            uuid: '6a518a04-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a04-0597-47eb-94c0-f72175389d3b',
            display: 'encounter',
            patient: 1
        }
    };

    var enc1 = {
        _id: 'enc_2',
        type: 'encounter',
        tags: {
            name1: 'Vitaliy',
            name2: 'Oleksiyovich',
            name3: 'Yuschecnko',
            uuid: '6a518a08-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a08-0597-47eb-94c0-f72175389d3b',
            display: 'encounter',
            patient: 2
        }
    };

    //OBS
    var obs0 = {
        _id: 'obs_1',
        type: 'obs',
        tags: {
            name1: 'Andriy',
            name2: 'Victorovich',
            name3: 'Ermolenko',
            uuid: '6a518a09-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a09-0597-47eb-94c0-f72175389d3b',
            person: 1,
            display: 'obs'
        }
    };

    var obs1 = {
        _id: 'obs_2',
        type: 'obs',
        tags: {
            name1: 'George',
            name2: 'Sergeevich',
            name3: 'Vasilenko',
            uuid: '6a518a10-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a10-0597-47eb-94c0-f72175389d3b',
            person: 2,
            display: 'obs'
        }
    };

    //LOCATIONS
    var location0 = {
        _id: 'loc_1',
        type: 'location',
        tags: {
            name: 'Ukraine',
            uuid: '6a518a11-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            display: 'location',
            uuid: '6a518a11-0597-47eb-94c0-f72175389d3b'
        }
    };

    //DRUGS
    var drug0 = {
        _id: 'drug_1',
        type: 'drug',
        tags: {
            name: 'oxygen',
            uuid: '6a518a12-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a12-0597-47eb-94c0-f72175389d3b',
            display: 'drug'
        }
    };

    var drug1 = {
        _id: 'drug_2',
        type: 'drug',
        tags: {
            name: 'nitrogen',
            uuid: '6a518a13-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a13-0597-47eb-94c0-f72175389d3b',
            display: 'drug'
        }
    };

    //CONCEPTS
    var con0 = {
        _id: 'con_1',
        type: 'concept',
        tags: {
            name: '123',
            uuid: '6a518a14-0597-47eb-94c0-f72175389d3b'
        },
        data: {
            uuid: '6a518a14-0597-47eb-94c0-f72175389d3b',
            display: 'concept'
        }
    }

    // adding data to ES
    beforeEach(function(doe) {
        // array for BULK commands
        var commands = [];
        // push user0_0
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'user_1'
            }
        });
        commands.push(user0_0);
        // push user0_1...  etc
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'user_2'
            }
        });
        commands.push(user0_1);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'user_3'
            }
        });
        commands.push(user0_2);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'user_4'
            }
        });
        commands.push(user0_3);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'user_5'
            }
        });
        commands.push(user0_4);
        // push access groups
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'acc_1'
            }
        });
        commands.push(access0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'acc_2'
            }
        });
        commands.push(access1);
        // push resource groups
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'res_1'
            }
        });
        commands.push(resource0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'res_2'
            }
        });
        commands.push(resource1);
        // push persons
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'per_1'
            }
        });
        commands.push(person0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'per_2'
            }
        });
        commands.push(person1);
        // push patients
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'pat_1'
            }
        });
        commands.push(patient0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'pat_2'
            }
        });
        commands.push(patient1);
        // push providers
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'pro_1'
            }
        });
        commands.push(provider0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'pro_2'
            }
        });
        commands.push(provider1);
        // push encounters
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'enc_1'
            }
        });
        commands.push(enc0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'enc_2'
            }
        });
        commands.push(enc1);
        // push orders
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'ord_1'
            }
        });
        commands.push(order0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'ord_2'
            }
        });
        commands.push(order1);
        // push obs
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'obs_1'
            }
        });
        commands.push(obs0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'obs_2'
            }
        });
        commands.push(obs1);
        // push locations
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'loc_1'
            }
        });
        commands.push(location0);
        // push drugs
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'drug_1'
            }
        });
        commands.push(drug0);
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'drug_2'
            }
        });
        commands.push(drug1);
        // push concepts
        commands.push({
            index: {
                _index: 'openmrs_test',
                _type: 'document',
                _id: 'con_1'
            }
        });
        commands.push(con0);
        // index data
        searchserver.bulk(commands, {}).on('done', function(done) {
            test = true;
            setTimeout(function() {
                doe();
            }, 1000);
        }).on('data', function(data) {}).exec();
    });

    it("Test flag must not be null", function(done) {
        expect(test).not.toBe(null);
        done();
    }, 10000);

    it("Request for person 'andriy' must return one person with name 'Andriy'", function(done) {
        request({
            uri: 'http://' + login + ':' + pass + '@localhost:' + config.appPort + '/' + 'person/andriy',
        }, function(err, res, body) {
            expect((JSON.parse(body)).length).toEqual(1);
            expect((JSON.parse(body))[0].preferredName.givenName).toEqual('Andriy');
            done();
        });
    }, 10000);

    it("Request for person 'vasiliy' must return no data", function(done) {
        request({
            uri: 'http://' + login + ':' + pass + '@localhost:' + config.appPort + '/' + 'person/vasiliy',
        }, function(err, res, body) {
            expect((JSON.parse(body)).length).toEqual(0);
            done();
        });
    }, 10000);

    it("Request for patient 'andriy' must return one patient", function(done) {
        request({
            uri: 'http://' + login + ':' + pass + '@localhost:' + config.appPort + '/' + 'patient/andriy',
        }, function(err, res, body) {
            expect(JSON.parse(body).length).toEqual(1);
            done();
        });
    }, 10000);

    it("Request for patient 'vasiliy' must return no data", function(done) {
        request({
            uri: 'http://' + login + ':' + pass + '@localhost:' + config.appPort + '/' + 'patient/vasiliy',
        }, function(err, res, body) {
            expect(JSON.parse(body).length).toEqual(0);
            done();
        });
    }, 10000);

    it("Request for provider 'abc' must return no data", function(done) {
        request({
            uri: 'http://' + login + ':' + pass + '@localhost:' + config.appPort + '/' + 'provider/abc',
        }, function(err, res, body) {
            expect(JSON.parse(body).error).toBeDefined();
            done();
        });
    }, 10000);
    
    it("Request for provider 'def' must return access error",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'provider/def',
        },
        function(err,res,body){
            expect(JSON.parse(body).error).toBeDefined();
            done();
        });
    },10000);
    
    it("Request for encounter 'andriy' must return one encounter",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'encounter/andriy',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(1);
            done();
        });
    },10000);
    
    it("Request for encounter without option must return one encounter",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'encounter',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(1);
            done();
        });
    },10000);
    
    it("Request for encounter 'vitaliy' must return no data",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'encounter/vitaliy',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(0);
            done();
        });
    },10000);
    
    it("Request for order 'andriy' must return one order",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'order/andriy',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(1);
            done();
        });
    },10000);
    
    it("Request for order without options must return two orders",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'order',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(2);
            done();
        });
    },10000);
    
    it("Request for order 'lidia' must return no data",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'order/lidia',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(0);
            done();
        });
    },10000);
    
    it("Request for location 'ukraine' must return access error",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'location/ukraine',
        },
        function(err,res,body){
            expect(JSON.parse(body).error).toBeDefined();
            done();
        });
    },10000);
    
    it("Request for drug without options must return two drugs",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'drug/',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(2);
            done();
        });
    },10000);
    
    it("Request for drug 'oxygen' must return one drug",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'drug/oxygen',
        },
        function(err,res,body){
            expect(JSON.parse(body).length).toEqual(1);
            done();
        });
    },10000);
    
    it("Request for obs 'andriy' must return access error",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'obs/andriy',
        },
        function(err,res,body){
            expect(JSON.parse(body).error).toBeDefined();
            done();
        });
    },10000);
    
    it("Request for concept without options must return access error",function(done) {
        request({
            uri: 'http://' + login  + ':' + pass + '@localhost:' + config.appPort + '/' + 'concept',
        },
        function(err,res,body){
            expect(JSON.parse(body).error).toBeDefined();
            done();
        });
    },10000); 
/*
    afterEach(function(doe) {
        setTimeout(function() {
            request({
                uri: 'http://' + config.esHost + ':' + config.esPort + '/' + indexName,
                method: 'DELETE'
            }, function(err, resp, body) {
                doe();
            });
        }, 100);
    }); */
});