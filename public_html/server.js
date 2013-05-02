// include modules
var http = require('http'),mysql = require("/usr/local/lib/node_modules/mysql");
var fs = require('fs');
var index = fs.readFileSync('./index.html');
path = require('path');
// mysql connection
var connection = mysql.createConnection({
   user: "root",
   password: "ermolenko",
   database: "openmrs"
});

// create searchserver object
var ElasticSearchClient = require('/usr/local/lib/node_modules/elasticsearchclient');
searchserver = new ElasticSearchClient({
    host:'localhost',
    port:'9200'
});

// indexing database
/*var query = "select given_name,family_name from person_name";
connection.query(query, function (error, rows, fields) {
     for (var i=0;i<rows.length;i++)
     searchserver.index('openmrs_test','document',rows[i]).on('data',function(data) {
         console.log("Indexing...., data: " + data);
     }).exec();
});*/

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
          // making simple query
          var que = {
              "query": {
                  "query_string": {
                      "query":data
                  }
              }
          };
          // search for data, and preparing response
          searchserver.search('openmrs_test', 'document',que , function(err, data){
              response.writeHead(200, {'Content-Type': 'x-application/json'});
              if (!err) response.end(JSON.stringify(data));
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
}).listen(8888);


