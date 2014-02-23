exports.Application = Application;

// imports
var express = require('express');
var Module = require('./module').Module;
// import entities
var Person = require('./person').Person;
var Patient = require('./patient').Patient;
var Encounter = require('./encounter').Encounter;
var Provider = require('./provider').Provider;
var Location = require('./location').Location;
var Concept = require('./concept').Concept;
var Drug = require('./drug').Drug;
var Obs = require('./obs').Obs;
var Order = require('./order').Order;
var Patientlist = require('./patientlist').Patientlist;
var User = require('./user').User;

/* Class Application
 * provide handlers for GET request, which are  based on express framework
 * 
 */
function Application() {
    module = new Module();
    person = new Person();
    patient = new Patient();
    provider = new Provider();
    location = new Location();
    encounter = new Encounter();
    obs = new Obs();
    order = new Order();
    drug = new Drug();
    concept = new Concept();
    patientlist = new Patientlist();
    user = new User();
    app = express();
    // CORS support
    var CORS = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        next();
    };
    app.configure(function() {
        app.use(CORS);
        app.use(express.bodyParser()); 
        app.use(express.basicAuth(user.check));
    });
}

/* Prototype start
 * set up handlers for GET requests, and run express app
 * 
 */
Application.prototype.start = function() {
    // start session updating
    user.update();
    // configure GET requests
    app.get('/patient',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.patient) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            patient.search(null,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/patient/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.patient) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            patient.search(request.params.data,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/patientlist',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.patient) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            patientlist.search(null,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/person',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.person) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            person.search(null,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/person/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.person) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            person.search(request.params.data,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });

    app.get('/provider',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.provider) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            provider.search(null,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/provider/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.provider) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            provider.search(request.params.data,request.query,function(result){
                response.json(result);
                gc();
            });
    });

    app.get('/location',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.location) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            location.search(null,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/location/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.location) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            location.search(request.params.data,request.query,function(result){
                response.json(result);
                gc();
            });
    });

    app.get('/encounter',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.encounter) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            encounter.search(null,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/encounter/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.encounter) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            encounter.search(request.params.data,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });

    app.get('/obs',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.obs) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            obs.search(null,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/obs/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.obs) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            obs.search(request.params.data,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });

    app.get('/order',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.order) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            order.search(null,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/order/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.order) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            order.search(request.params.data,request.query,u,function(result){
                response.json(result);
                gc();
            });
    });

    app.get('/drug',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.drug) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            drug.search(null,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/drug/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.drug) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            drug.search(request.params.data,request.query,function(result){
                response.json(result);
                gc();
            });
    });

    app.get('/concept',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.concept) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            concept.search(null,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    
    app.get('/concept/:data',function(request,response) {
        // get user by request headers
        var u = user.getUser(request);
        // check access privileges
        if ((!u) || (u.privileges.indexOf(objectType.concept) === -1)) 
            response.json({
                'error' : {
                    message : errorType.access_denied
                 }
            });
        // if access granted
        else 
            concept.search(request.params.data,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    
    // return 404 for other requests
    app.get('*',function(request,response) {
        response.status(404).send('Not found');
    });
    // run app on selected port
    app.listen(config.appPort);
};

/* Prototype river
 * add rivers for selected resources
 * 
 */
Application.prototype.river = function(callback) {
    // create rivers
    async.series([
        function(callback) {
            concept.river(callback);
        },
        function(callback) {
            provider.river(callback);
        },
        function(callback) {
            patient.river(callback);
        },
        function(callback) {
            order.river(callback);
        },
        function(callback) {
            patientlist.river(callback);
        },
        function(callback) {
            encounter.river(callback);
        },
        function(callback) {
            location.river(callback);
        },
        function(callback) {
            obs.river(callback);
        },
        function(callback) {
            drug.river(callback);
        },
        function(callback) {
            person.river(callback);
        },
        function(callback) {
            user.river(callback);
        }
    ],function(err,res) {
        callback();
    });
};

/* Prototype clean
 * remove rivers for selected resources, and clean data
 * 
 */
Application.prototype.clean = function(callback) {
    async.series([
        function(callback) {
            concept.remove(callback);
        },
        function(callback) {
            patient.remove(callback);
        },
        function(callback) {
            provider.remove(callback);
        },
        function(callback) {
            person.remove(callback);
        },
        function(callback) {
            location.remove(callback);
        },
        function(callback) {
            encounter.remove(callback);
        },
        function(callback) {
            obs.remove(callback);
        },
        function(callback) {
            order.remove(callback);
        },
        function(callback) {
            drug.remove(callback);
        },
        function(callback) {
            patientlist.remove(callback);
        },
        function(callback) {
            user.remove(callback);
        }
    ],function(err,res) {
        // remove indexed data
        request({
            uri: 'http://' + config.esHost + ':' + config.esPort + '/' + indexName,
            method : 'DELETE'
        },function(err,resp,body){
            callback();
        });
    });
};



