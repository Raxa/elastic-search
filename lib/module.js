exports.Module = Module;

/* Class Module                                                             *
 *                                                                          *
 * This class handles all required imports, static fields (such as defines  *
 * for type of search, errot type, etc; and make connections                *
 * to Mysql and ES servers. Also it handle server properties                *
 *                                                                          *
 */            

function Module() {
    
    /*
     *  Imports
     */
    
    this.fs = require('fs');
    this.http = require('http');
    this.path = require('path');
    this.async = require('async');
    
    // get config
    Store = require('configstore');
    // init config with default values
    this.config = new Store('elasticsearch',{
        dbHost : 'localhost',
        dbUser : 'root',
        dbPass : 'ermolenko',
        dbName : 'openmrs',
        esHost : 'localhost',
        esPort : '9200',
        indexed : false
    });
    
    Query = require('./query').Query;
    // index name
    this.indexName = 'openmrs_test';
    // type of index
    this.indexType = 'document';
    // search types
    this.searchType = {
        plain: 'plain',
        single: 'single'
    };
    // result of search
    this.searchResult = {
        ok: 'ok',
        error: 'error'
    };
    // types for search
    this.objectType = {
        person: 'person',
        patient: 'patient',
        provider: 'provider',
        drug: 'drug',
        obs: 'obs',
        order: 'order',
        encounter: 'encounter',
        location: 'location',
        concept: 'concept',
        concept_set : 'concept_set',
        concept_name : 'concept_name',
        concept_answer : 'concept_answer',
        concept_description : 'concept_description'
    };
    // error types
    this.errorType = {
        incorr_data : 'Incorrect value for searching',
        unimplemented : 'This type is not implemented yet',
        server_err : 'Server error'
    };
    // make connections
    var Mysql = require('/usr/local/lib/node_modules/mysql');
    var Es = require('/usr/local/lib/node_modules/elasticsearchclient');
    // create connection to Mysql
    this.connection = Mysql.createConnection({
        user: this.config.get('dbUser'),
        password: this.config.get('dbPass'),
        database: this.config.get('dbName')
    });
    // create connection to ES
    this.searchserver = new Es({
        host: this.config.get('esHost'),
        port: this.config.get('esPort')
    });
};

/* Test if data uuid or not
 * 
 * @param {type} data - uuid value
 * @returns {Boolean} - 
 */
Module.prototype.uuid = function(data) {
    // basically only length will be checked
    return data.length === 36;
};

/* Function for getting data from search server
 * 
 * @param {type} query - query for searching
 * @param {type} data - data for searching
 * @param {type} callback  -function for returning result
 */
Module.prototype.getData = function(query, callback) {
    searchserver.search(this.indexName, this.indexType, query, function(err, data) {
        var out = {
            result : searchResult.error,
            data : {}
        };
        var json = JSON.parse(data);
        if ((!err) && (!json.error) && (json.hits)) {
            out.result = searchResult.ok;
            out.data = json.hits;
        }
        if (callback) callback(out);
    });
};
    
/* Get resulting data by value of its field, and choosen type
 * 
 * @param {type} type - type of object for searching
 * @param {type} field - name of the field
 * @param {type} value - requested value of the field
 * @param {type} callback - function for returning data
 */
Module.prototype.getDataByField = function(type,field,value,callback) {
    var query = new Query(value);
    query.addField(field);
    query.addFilter('type',type);
    getData(query.q,function(value){
            if ((value.result === this.searchResult.ok) && (value.data.total > 0)) {
                // if there is one element 
                if (value.data.hits.length === 1) callback(value.data.hits[0]._source.data);
                // if there are multiple elements
                else {
                    var total = 0;
                    var result = [];
                    // check each element of array
                    value.data.hits.forEach(function(item){
                        if (item) result.push(item._source.data);
                        total++;
                        // if we check all elements - return resulting array
                        if (total === value.data.hits.length) callback(result);
                    });
                }
            }
            // if we get nothing, or error during search - return null
            else callback(null);
        });
};

