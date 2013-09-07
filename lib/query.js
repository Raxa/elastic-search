exports.Query = Query;

/* Query Class 
 * class for preparing search queries
 *  
 */
function Query(data) {
    this.q = {
        size: config.appMaxResponse,
        "query": {
            "filtered": {
                query: {
                    field : {
                        type : data
                    }
                }
            }
        }
    };
}

/* Prototype addFuzzyOption
 * Add fuzzy option to query 
 * 
 * @param {type} field - add option name
 * @param {type} data - option value
 * @returns {undefined}
 */
Query.prototype.addFuzzyOption = function(field, data) {
    if (!this.q.query.filtered.filter) this.q.query.filtered['filter'] = {};
    if (!this.q.query.filtered.filter.or) this.q.query.filtered.filter['or'] = [];
    var o = {
        query: {
            fuzzy: {}
        }
    };
    o.query.fuzzy[field] = data;
    this.q.query.filtered.filter.or.push(o);
};

/* Prototype addOption
 * Add option to query 
 * 
 * @param {type} field - add option name
 * @param {type} data - option value
 * @returns {undefined}
 */
Query.prototype.addOption = function(field, data) {
    if (!this.q.query.filtered.filter) this.q.query.filtered['filter'] = {};
    if (!this.q.query.filtered.filter.or) this.q.query.filtered.filter['or'] = [];
    var o = {
        query: {
            field: {}
        }
    };
    o.query.field[field] = data;
    this.q.query.filtered.filter.or.push(o);
};

/* Prototype addFilter
 * Add filter to query 
 * 
 * @param {type} field - add option name
 * @param {type} data - option value
 * @returns {undefined}
 */
Query.prototype.addFilter = function(field, data) {
    if (!this.q.query.filtered.filter) this.q.query.filtered['filter'] = {};
    if (!this.q.query.filtered.filter.and) this.q.query.filtered.filter['and'] = [];
    var o = {
        query: {
            field: {}
        }
    };
    o.query.field[field] = data;
    this.q.query.filtered.filter.and.push(o);
};