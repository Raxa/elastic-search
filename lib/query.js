exports.Query = Query;

/* Query Class 
 * class for preparing search queries
 *  
 */
function Query(data) {
    this.q = {
        size : config.appMaxResponse,
            "query": {
                "filtered" : {
                    "query" : {
                        "query_string" : {
                            fields : [],
                            query : data
                        }
                    }
                }
            }
    };
}
        
/* Prototype addField
 * Add field for searching 
 *  
 * @param {type} field - field, which add to query
 */
Query.prototype.addField = function(field) {
    this.q.query.filtered.query.query_string.fields.push(field);
};
        
/* Prototype addFilter
 * Add filter to query 
 * 
 * @param {type} type - name of the filter field
 * @param {type} data - value for filtering
 * @returns {undefined}
 */
Query.prototype.addFilter = function(type,data) {
    if (!this.q.query.filtered.filter) {
        this.q.query.filtered['filter'] = {
            and : []
        };
    }
    var o ={
        query : {
            field : {}
        }
    };
    o.query.field[type] = data;
    this.q.query.filtered.filter.and.push(o);
 };

