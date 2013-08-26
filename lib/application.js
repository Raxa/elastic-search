exports.Application = Application;

var express = require('express');
var exec = require('child_process').exec;
//import and configure ES search server
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
var User = require('./user').User;

/* Class Application
 * 
 * 
 * 
 */
function Application() {
    module = new Module();
    person = new Person(module);
    patient = new Patient(module);
    provider = new Provider(module);
    location = new Location(module);
    encounter = new Encounter(module);
    obs = new Obs(module);
    order = new Order(module);
    drug = new Drug(module);
    concept = new Concept(module);
    user = new User(module);
    app = express();
    app.configure(function() {
        app.use(express.bodyParser()); 
        if (config.appAuth) app.use(express.basicAuth(user.check));
        app.use(express.cookieParser());
        app.use(express.session({secret: 'raxa_secretZZZ'}));
    });
}

/* Prototype start
 * 
 * 
 */
Application.prototype.start = function() {
    user.update();
    // configure GET requests
    // patient
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
    // person
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
    // provider
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
    // location
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
    // encounter
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
            encounter.search(null,request.query,function(result){
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
            encounter.search(request.params.data,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    // obs
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
            obs.search(null,request.query,function(result){
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
            obs.search(request.params.data,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    // order
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
            order.search(null,request.query,function(result){
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
            order.search(request.params.data,request.query,function(result){
                response.json(result);
                gc();
            });
    });
    // drug
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
    // concept
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
    // run app
    app.listen(config.appPort);
};

/* Prototype river
 * 
 * 
 */
Application.prototype.river = function(callback) {
    // creating rivers
    async.parallel([
        function(callback) {
            person.river(callback);
        }, 
        function(callback) {
            patient.river(callback);
        },
        function(callback) {
            provider.river(callback);
        },
        function(callback) {
            concept.river(callback);
        },
        function(callback) {
            location.river(callback);
        },
        function(callback) {
            encounter.river(callback);
        },
        function(callback) {
            obs.river(callback);
        },
        function(callback) {
            order.river(callback);
        },
        function(callback) {
            drug.river(callback);
        },
        function(callback) {
            user.river(callback);
        }
    ],function(err,res) {
        callback();
    });
};

/* Prototype clean
 * 
 * 
 */
Application.prototype.clean = function(callback) {
    async.parallel([
        function(callback) {
            person.remove(callback);
        },
        function(callback) {
            patient.remove(callback);
        },
        function(callback) {
            provider.remove(callback);
        },
        function(callback) {
            concept.remove(callback);
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
            user.remove(callback);
        }
    ],function(err,res) {
        // removing index data
        request({
            uri: 'http://' + config.esHost + ':' + config.esPort + '/' + indexName,
            method : 'DELETE'
        },function(err,resp,body){
            callback();
        });
    });
};



