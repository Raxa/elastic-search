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
es.addEntity(new Patient(module));
es.addEntity(new Provider(module));
es.addEntity(new Encounter(module));
es.addEntity(new Location(module));
es.addEntity(new Drug(module));
es.addEntity(new Obs(module));
es.addEntity(new Order(module));
es.addEntity(new Concept(module));

var time = new Date();

es.index(function(){console.log('indexing done :' + (new Date() - time));});

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
    } else {
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
                    } else {
                        response.writeHead(200, {
                            'Content-Type': contentType
                        });
                        response.end(content, 'utf-8');
                    }
                });
            } else {
                response.writeHead(404);
                response.end();
            }
        });
    }

}).listen(1024);