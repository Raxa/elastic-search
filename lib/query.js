exports.Query = Query;

/* Query class - class for preparing search queries
 * 
 * 
 */
function Query(data) {
    this.q = {
        size : 1000000,
            "query": {
                "filtered" : {
                    "query" : {
                        "query_string" : {
                            fields : [],
                            "query" : data
                        }
                    }
                }
            }
    };
}
        
/* Add field for searching 
 * 
 * @param {type} field - field, which add to query
 */
Query.prototype.addField = function(field) {
    this.q.query.filtered.query.query_string.fields.push(field);
};
        
 /* Add filter to query 
 * 
 * @param {type} type - name of the filter field
 * @param {type} data - value for filtering
 * @returns {undefined}
 */
Query.prototype.addFilter = function(type,data) {
    if (!this.q.query.filtered.filter) {
        this.q.query.filtered['filter'] = {
            "query" : {
                field : {}
            }
        };
        this.q.query.filtered.filter.query.field[type] = data;
    }
 };


