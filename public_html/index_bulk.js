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
     var commands = [];
     commands.push({"index" : {"_index" : "openmrs_test","_type" : "document"}});
     for (var i=0;i<rows.length;i++)
         commands.push(rows[i]);
     searchserver.bulk(commands,{}).on('done',function(done) {
         console.log('Finished, current time: ' + (new Date().getTime() - time));
     }).exec();
         
         
});


