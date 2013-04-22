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
          // parsing JSON
          var values = JSON.parse(data);
          var query = "select given_name,date_created from person_name";
          if (values !== "") query += " where given_name = '" + values + "'";
          // send response
          connection.query(query, function (error, rows, fields) {
              response.writeHead(200, {'Content-Type': 'x-application/json'});
              if (!error) response.end(JSON.stringify(rows));
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


