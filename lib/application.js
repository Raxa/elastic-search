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

/* Class Application
 * 
 * 
 * 
 */
function Application() {
    app = express();
    app.configure(function() {
        app.use(express.bodyParser()); 
    });
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
}

/* Prototype start
 * 
 * 
 */
Application.prototype.start = function() {
    // configure GET requests
    var module = this.module;
    //default
    app.get('/',function(request,response){
        response.json({
            message : 'Testing elasticsearch server for RAXA medical data'
        });
    });
    // patient
    app.get('/patient',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        patient.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/patient/:data',function(request,response) {
        patient.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // person
    app.get('/person',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        person.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/person/:data',function(request,response) {
        person.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // provider
    app.get('/provider',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        provider.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/provider/:data',function(request,response) {
        provider.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // location
    app.get('/location',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        location.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/location/:data',function(request,response) {
        location.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // encounter
    app.get('/encounter',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        encounter.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/encounter/:data',function(request,response) {
        encounter.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // obs
    app.get('/obs',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        obs.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/obs/:data',function(request,response) {
        obs.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // order
    app.get('/order',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        order.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/order/:data',function(request,response) {
        order.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // drug
    app.get('/drug',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        drug.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/drug/:data',function(request,response) {
        drug.search(request.params.data,function(result){
            response.json(result);
            gc();
        });
    });
    // concept
    app.get('/concept',function(request,response) {
        var query = '';
        if (request.query.q) query = request.query.q;
        concept.search(query,function(result){
            response.json(result);
            gc();
        });
    });
    app.get('/concept/:data',function(request,response) {
        concept.search(request.params.data,function(result){
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



