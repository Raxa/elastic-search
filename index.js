var Module = require('./lib/module').Module;
var Person = require('./lib/person').Person;
var Patient = require('./lib/patient').Patient;
var Encounter = require('./lib/encounter').Encounter;
var Provider = require('./lib/provider').Provider;
var Location = require('./lib/location').Location;
var Concept = require('./lib/concept').Concept;
var Drug = require('./lib/drug').Drug;
var Obs = require('./lib/obs').Obs;
var Order = require('./lib/order').Order;
var ConceptSet = require('./lib/conceptset').ConceptSet;
var ConceptName = require('./lib/conceptname').ConceptName;
var ConceptDesc = require('./lib/conceptdescription').ConceptDescription;

var module = new Module();

var args = process.argv.splice(2);
switch (args[0]) {
    // index each type
    case 'person':
        var person = new Person(module);
        person.index(function(){
            console.log('persons indexed');
            process.exit();
        });
        break;
    case 'patient':
        var patient = new Patient(module);
        patient.index(function() {
            console.log('patient indexed');
            process.exit();
        });
        break;
    case 'provider':
        var provider = new Provider(module);
        provider.index(function(){
            console.log('provider indexed');
            process.exit();
        });
        break;
    case 'location':
        var location = new Location(module);
        location.index(function() {
            console.log('location indexed');
            process.exit();
        });
        break;
    case 'encounter':
        var encounter = new Encounter(module);
        encounter.index(function(){
            console.log('encounter indexed');
            process.exit();
        });
        break;
    case 'obs' : 
        var obs = new Obs(module);
        obs.index(function(){
            console.log('obs indexed');
            process.exit();
        });
        break;
    case 'order' : 
        var order = new Order(module);
        order.index(function(){
            console.log('order indexed');
            process.exit();
        });
        break; 
    case 'drug':
        var drug = new Drug(module);
        drug.index(function(){
            console.log('drug indexed');
            process.exit();
        });
        break;
    case 'concept':
        var concept = new Concept(module);
        concept.index(function(){
            console.log('concepts indexed');
            process.exit();
        });
        break;
    case 'concept_name' :
        var conceptName = new ConceptName(module);
        conceptName.index(function(){
            console.log('concept names indexed');
            process.exit();
        });
        break;
    case 'concept_set' :
        var conceptSet = new ConceptSet(module);
        conceptSet.index(function(){
            console.log('concept set indexed');
            process.exit();
        });
        break;
    case 'concept_description' :
        var conceptDesc = new ConceptDesc(module);
        conceptDesc.index(function(){
            console.log('concept desc indexed');
            process.exit();
        });
        break;
    default:
        console.log('invalid params');
        break;
}

