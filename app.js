// imports
var Module = require('./lib/module').Module;
var ES = require('./lib/searchserver').SearchServer;
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

// create ES server
var module = new Module();
var es = new ES(module);
// add required entities
es.addEntity(new Person(module));
es.addEntity(new Concept(module));
es.addEntity(new Encounter(module));
es.addEntity(new Patient(module));
es.addEntity(new Obs(module));
es.addEntity(new Order(module));
es.addEntity(new Drug(module));
es.addEntity(new Location(module));
es.addEntity(new Provider(module));

var args = process.argv.splice(2);

// index selected items
if (args[0] === 'index') {
    var time = new Date();
    es.index(function(){
        console.log('indexing done :' + (new Date() - time));
        process.exit(0);
    });
}

// run search server
else if (args[0] === 'run') {
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
                response.writeHead(200, {'Content-Type': 'x-application/json'});
                // if searc server is started
                es.search(object.type, object.item, object.data, function(result) {
                    response.end(JSON.stringify(result));
                });
            });
        } 
        if (request.method === "GET") {
            // selected contecn type is text (just for testing)
            response.writeHead(200, {'Content-Type': 'text/html'});
            // parse URL
            var parts = url.parse(request.url,true);
            // parse path
            var tokens = parts.path.substr(1).split(path.sep);
            //var tokens = parts.path.match(/\w+/g);
            if ((tokens.length > 0) && (tokens.length < 3)) {
                // test if this type is registered
                es.isRegisteredType(tokens[0],function(result) {
                    // type is registered
                    if (result === true) {
                        // if both type and data selected
                        if (tokens.length === 2) 
                            try {
                                es.search(searchType.single,tokens[0],tokens[1],function(result) {
                                    response.end(JSON.stringify(result));
                                });
                            }
                            catch (e) {
                                response.end('error');
                            }
                    }
                });
            }
            else response.end('error');
        }
    }).listen(1024);
}

// clean index (need test)
else if (args[0] === 'default') {
    config.set('indexpatient',false);
    config.set('indexperson',false);
    config.set('indexprovider',false);
    config.set('indexdrug',false);
    config.set('indexlocation',false);
    config.set('indexconcept',false);
    config.set('indexencounter',false);
    config.set('indexorder',false);
    config.set('indexobs',false);
    es.clean(function(){
        console.log('index cleaned');
    });
}

else console.log('invalid params');



