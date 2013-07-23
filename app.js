// import and configure express
var express = require('express');
var request = require('request');
var exec = require('child_process').exec;
var app = express();
app.configure(function() {
    app.use(express.bodyParser()); 
});

// parse command line args
var args = process.argv.splice(2);
switch(args[0]) {
    // run search server
    case 'run':
        //import and configure ES search server
        var Module = require('./lib/module').Module;
        // import entities
        var Person = require('./lib/person').Person;
        var Patient = require('./lib/patient').Patient;
        var Encounter = require('./lib/encounter').Encounter;
        var Provider = require('./lib/provider').Provider;
        var Location = require('./lib/location').Location;
        var Concept = require('./lib/concept').Concept;
        var Drug = require('./lib/drug').Drug;
        var Obs = require('./lib/obs').Obs;
        var Order = require('./lib/order').Order;
        // create instances
        var module = new Module();
        // create instances
        var person = new Person(module);
        var patient = new Patient(module);
        var provider = new Provider(module);
        var location = new Location(module);
        var encounter = new Encounter(module);
        var obs = new Obs(module);
        var order = new Order(module);
        var drug = new Drug(module);
        var concept = new Concept(module);
        // configure GET requests
        //default
        app.get('/',function(request,response){
            response.json({
                message : 'Testing elasticsearch server for RAXA medical data'
            });
        });
        // patient
        app.get('/patient',function(request,response) {
            patient.search('',function(result){
                response.json(result);
            });
        });
        app.get('/patient/:data',function(request,response) {
            patient.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // person
        app.get('/person',function(request,response) {
            person.search('',function(result){
                response.json(result);
            });
        });
        app.get('/person/:data',function(request,response) {
            person.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // provider
        app.get('/provider',function(request,response) {
            provider.search('',function(result){
                response.json(result);
            });
        });
        app.get('/provider/:data',function(request,response) {
            provider.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // location
        app.get('/location',function(request,response) {
            location.search('',function(result){
                response.json(result);
            });
        });
        app.get('/location/:data',function(request,response) {
            location.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // encounter
        app.get('/encounter',function(request,response) {
            encounter.search('',function(result){
                response.json(result);
            });
        });
        app.get('/encounter/:data',function(request,response) {
            encounter.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // obs
        app.get('/obs',function(request,response) {
            obs.search('',function(result){
                response.json(result);
            });
        });
        app.get('/obs/:data',function(request,response) {
            obs.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // order
        app.get('/order',function(request,response) {
            order.search('',function(result){
                response.json(result);
            });
        });
        app.get('/order/:data',function(request,response) {
            order.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // drug
        app.get('/drug',function(request,response) {
            drug.search('',function(result){
                response.json(result);
            });
        });
        app.get('/drug/:data',function(request,response) {
            drug.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // concept
        app.get('/concept',function(request,response) {
            concept.search('',function(result){
                response.json(result);
            });
        });
        app.get('/concept/:data',function(request,response) {
            concept.search(request.params.data,function(result){
                response.json(result);
            });
        });
        // run app on port 1024
        app.listen(1024);
        break;
    // index all data
    case 'index':
        var async = require('async');
        // items for indexing
        var index = [
            'person',
            'provider',
            'patient',
            'obs',
            'encounter',
            'order',
            'drug',
            'location',
            'concept',
            'concept_name',
            'concept_set',
            'concept_description'
        ];
        // index each entity in child process
        async.eachSeries(index,function(item,callback){
            exec('node index.js ' + item,function(err,sout,serr){
                console.log('indexing ' + item + ' done');
                callback();
            });
        },function(err){
            process.exit();
        });
        break;
    // clean index
    case 'clean':
        // delete index
        request({
            uri: 'http://localhost:9200/openmrs_test',
            method : 'DELETE'
        });
        console.log('index cleaned');
        break;
    default:
        console.log('invalid params');
        break;
}







