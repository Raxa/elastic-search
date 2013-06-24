// include modules
var http = require('http');
var path = require('path');
var fs = require('fs');

// class for search layer
function ElasticSearch() {
    
    /*
     * Private attributes/methods
     */
    
    // mysql module
    var mysql = require("/usr/local/lib/node_modules/mysql");
    // open MySQL connection
    var connection = mysql.createConnection({
        user: "root",
        password: "ermolenko",
        database: "openmrs"
    });
    // create searchserver object
    var ElasticSearchClient = require('/usr/local/lib/node_modules/elasticsearchclient');
    var searchserver = new ElasticSearchClient({
        host:'localhost',
        port:'9200'
    });
    
    /*
     * Public attributes/methods
     */
    
    // name for indexing
    this.indexname = 'openmrs_test';
    // type of index
    this.indextype = 'document';
    // index selected fields
    this.index = function(callback) {
        var query = "select given_name,family_name from person_name";
        connection.query(query, function (error, rows, fields) {
            for (var i=0;i<rows.length;i++)
            searchserver.index('openmrs_test','document',rows[i]).on('data',function(data) {
                // checking if required
            }).exec();
        });
    };
    // search 
    this.search = function(type,data,callback) {
        if (type === "plain") {
            var que = {
                "query": {
                    "query_string": {
                        "query":data
                     }
                }
            };
            searchserver.search(this.indexname, this.indextype, que, function(err, data) {
                if ((!err) && (callback)) callback(data);
            });
        }
    };
}

var es = new ElasticSearch();
es.index();

http.createServer(function (request, response) {
    if (request.method === "POST") {
       // data buffer
       var data = '';
       // getting data chunks
       request.on('data', function (chunk) {
          data += chunk;
       });
       // all data loaded
       request.on('end', function () {
           // parsing data
           var object = JSON.parse(data);
           es.search(object.type,object.data,function(result) {
               response.writeHead(200, {'Content-Type': 'x-application/json'});
               response.end(JSON.stringify(result));
           });
       });
    }
    
    else {
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
                    }
                    else {
                        response.writeHead(200, {'Content-Type': contentType});
                        response.end(content, 'utf-8');
                    }
                });
            }
            else {
                response.writeHead(404);
                response.end();
            }
        });
    }
    
}).listen(1024);


