var time = new Date().getTime();
var mysql = require("/usr/local/lib/node_modules/mysql");
var connection = mysql.createConnection({
   user: "root",
   password: "ermolenko",
   database: "openmrs"
});
var ElasticSearchClient = require('/usr/local/lib/node_modules/elasticsearchclient');
searchserver = new ElasticSearchClient({
    host:'localhost',
    port:'9200'
});
var query = "select given_name,family_name from person_name";
connection.query(query, function (error, rows, fields) {
     for (var i=0;i<rows.length;i++)
     searchserver.index('openmrs_test','document',rows[i]).on('done',function(done) {
         var current = new Date().getTime() - time;
         console.log('Each indexing finished, current time: ' + current);
     }).exec();
});

