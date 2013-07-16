// imports
var Module = require('./lib/module').Module;
var ES = require('./lib/searchserver').SearchServer;
var Person = require('./lib/person').Person;

// create ES server
var module = new Module();
var es = new ES(module);
// add required entities
es.addEntity(new Person(module));

module.http.createServer(function(request, response) {
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
        var filePath = module.path.join('.', request.url);
        //checking includes
        module.path.exists(filePath, function(exists) {
            if (exists) {
                var extname = module.path.extname(filePath);
                var contentType = 'text/html';
                switch (extname) {
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                }
                module.fs.readFile(filePath, function(error, content) {
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