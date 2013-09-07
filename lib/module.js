exports.Module = Module;

/* Class Module 
 * 
 * This class handles all required imports, static objects (such as defines 
 * for type of search, errot type, etc), provide connections
 * to Mysql and ES servers, store settings
 * 
 */
function Module() {
    
   /*
    *  Imports
    */
   
    fs = require('fs');
    http = require('http');
    path = require('path');
    async = require('async');
    url = require('url');
    mysql = require('mysql');
    es = require('elasticsearchclient');
    request = require('request');
    crypto = require('crypto');
    Query = require('./query').Query;
    River = require('./river').River;
    
    /*
     * Static objects
     */
    
    // index name
    indexName = 'openmrs_test';
    // type of index
    indexType = 'document';
    // search types
    searchType = {
        plain: 'plain',
        single: 'single'
    };
    // result of search
    searchResult = {
        ok: 'ok',
        error: 'error'
    };
    // types for search
    objectType = {
        //--------------------------
        person: 'person',
        person_name : 'person_name',
        person_address : 'person_address',
        person_attribute : 'person_attribute',
        //--------------------------
        patient: 'patient',
        patient_identifier : 'patient_identifier',
        //--------------------------
        provider: 'provider',
        provider_attribute : 'provider_attribute',
        //--------------------------
        drug: 'drug',
        //--------------------------
        obs: 'obs',
        //--------------------------
        order: 'order',
        //--------------------------
        encounter: 'encounter',
        form : 'form',
        //--------------------------
        location: 'location',
        location_tag : 'location_tag',
        location_attribute : 'location_attribute',
        //--------------------------
        concept: 'concept',
        concept_set : 'concept_set',
        concept_name : 'concept_name',
        concept_description : 'concept_description',
        //--------------------------
        user : 'user',
        user_access : 'user_access',
        user_resource : 'user_resource'
    };
    // error types
    errorType = {
        incorr_data : 'Incorrect value for searching',
        server : 'Server error',
        no_data : 'There no data suggesting to request',
        access_denied : 'You have ho access for this data'
    };
    // load condifguration
    config = null;
    connection = null;
    searchserver = null;
    try {
        var data = fs.readFileSync('./config/default.json','utf8');
        config = JSON.parse(data);
    }
    catch(e) {
        config = {
            appPort: '1024',
            dbHost : 'localhost',
            dbUser : 'root',
            dbPass : 'ermolenko',
            dbName : 'openmrs',
            esHost : 'localhost',
            esPort : '9200',
            appMaxResponse: '1000',
            appMaxBulkReq : "1",
            appMaxBulkSize : "100",
            appMaxBulkFetchSize : "10",
            appSessionLength : 10
        };
    };
    // create connection to Mysql
    connection = mysql.createConnection({
        user: config.dbUser,
        password: config.dbPass,
        database: config.dbName
    });
    // create connection to ES
    searchserver = new es({
        host: config.esHost,
        port: config.esPort
    });
    
   /* Function trimUUID
    * test if data uuid or not, if it is uuid - trim it to short form
    * (for searching)
    *
    * @param {type} data - uuid value
    * @returns {Boolean} -
    */
    trimUUID = function(data) {
        // basically only length will be checked
        if (data.length === 36) return data.substring(0,8);
        return data;
    };
    
    /* Function getData
    *  get data from search server by search query
    *
    * @param {type} query - query for searching
    * @param {type} data - data for searching
    * @param {type} callback -function for returning result
    */
    getData = function(query, callback) {
        searchserver.search(indexName, indexType, query, function(err, data) {
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

    /* Function getDataByField
    *  get resulting data by value of selected field, and choosen type
    *
    * @param {type} type - type of object for searching
    * @param {type} field - name of the field
    * @param {type} value - requested value of the field
    * @param {type} callback - function for returning data
    */
    getDataByField = function(type,field,value,callback) {
        var query = new Query(type);
        query.addOption(field,value);
        getData(query.q,function(value){
            if ((value.result === searchResult.ok) && (value.data.total > 0)) {
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
                        if (total === value.data.hits.length) {
                            callback(result);
                        }
                    });
                }
            }
            // if we get nothing, or error during search - return null
            else callback(null);
        });
    };
};

