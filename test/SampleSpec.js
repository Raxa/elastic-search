var exec = require('child_process').exec;
var request = require('request');
var crypto = require('crypto');

var Module = require('../lib/module').Module;
var AsyncSpec = require('./asyncspec').AsyncSpec;

module = new Module();

describe('jasmine-node', function(){
    
   /*
    * 
    *  Data for testing
    *  We will add user0, which have access:
    *  GRANTED : persons, patients, providers, encounters and drugs ; 
    *  RESTRICTED : locations, concepts, orders, obs;
    *  ACCSESS GROUPS : 1;
    *  
    */ 
   
   var test;
   var sha512 = crypto.createHash('sha512');
   sha512.update('12345' + '3eff1aa4363beab41','utf8');
   var p = sha512.digest('hex');
    // USERS
    var user0_0 = {
        type : 'user',
        id : 1,
        data : {
            user : 'test',
            pass : p,
            salt : '3eff1aa4363beab41',
            role : 'person',
            privilege : 'View People'
        }
    };
    
    var user0_1 = {
        type : 'user',
        id : 2,
        data : {
            user : 'test',
            pass : p,
            salt : '3eff1aa4363beab41',
            role : 'person',
            privilege : 'View Patients'
        }
    };
    
    var user0_2 = {
        type : 'user',
        id : 3,
        data : {
            user : 'test',
            pass : p,
            salt : '3eff1aa4363beab41',
            role : 'person',
            privilege : 'View Providers'
        }
    };

   var user0_3 = {
        type : 'user',
        id : 4,
        data : {
            user : 'test',
            pass : p,
            salt : '3eff1aa4363beab41',
            role : 'person',
            privilege : 'View Encounters'
        }
    };
    
    var user0_4 = {
        type : 'user',
        id : 5,
        data : {
            user : 'test',
            pass : p,
            salt : '3eff1aa4363beab41',
            role : 'person',
            privilege : 'View Drug Info'
        }
    };
    
    // USER_ACCESS
    
    // acess group with id = 1
    var access0 = {
        type : 'user_access',
        data : {
            id : 1,
            person : 1
        }
    };
    
    // access group with id = 2
    var access1 = {
        type : 'user_access',
        data : {
            id : 2,
            person : 2
        }
    };
    
    var _command = {
        index : {
            _index : 'openmrs_test',
            _type : 'document'
        }
    };

    // adding data to ES
    beforeEach(function(doe){
        // array for BULK commands
        var commands = [];
        // push user0_0
        commands.push(_command);
        commands.push(user0_0);
        // push user0_1...  etc
        commands.push(_command);
        commands.push(user0_1);
        commands.push(_command);
        commands.push(user0_2);
        commands.push(_command);
        commands.push(user0_3);
        commands.push(_command);
        commands.push(user0_4);
        // push access groups
        commands.push(_command);
        commands.push(access0);
        commands.push(_command);
        commands.push(access1);
        searchserver.bulk(commands,{}).on('done',function(done){
            test = true;    
            doe();
        }).exec();
    });
    
    it("Test data must be added", function() {
        runs(function () {
            expect(test).toBe(true);
        });
    });
  
});
