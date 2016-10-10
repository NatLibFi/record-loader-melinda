/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'melinda-api-client',
      'marc-record-js',
      'record-loader-prototypes/lib/record-store/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('melinda-api-client'),
      require('marc-record-js'),
      require('record-loader-prototypes/lib/record-store/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, MelindaClient, MarcRecord, recordStoreFactory) {

  'use strict';

  function getRecordId(record)
  {
    return record.get(/^001$/).shift().value;
  }

  /**
   * @param {object} parameters
   * @param {string} parameters.url - URL of the Melinda API endpoint
   * @param {string} parameters.user - Melinda user name
   * @param {string} parameters.password - Melinda user password
   * @param {boolean} parameters.useCache - Determines if caching of records should be used. A record enters the cache when it's retrieved and is removed when the record is deleted or updated in Melinda
   * @param {number} [parameters.retry] - Number of milliseconds to wait before retrying the API request. Retry is only done once for each API request
   */
  return function(parameters)
  {

    var logger,
    melinda_client = new MelindaClient({
      endpoint: parameters.url,
      user: parameters.user,
      password: parameters.password
    }),
    fn_handle_error = typeof parameters.retry === 'number' ? function(error, callback) {

      return new Promise(function(resolveCallback, rejectCallback) {
        setTimeout(function() {
          callback().then(resolveCallback, rejectCallback);
        }, parameters.retry);
      });    

    } : function(error) {
      return Promise.reject(error);
    },
    obj = recordStoreFactory();

    function readRecordFromCache(id, fetch_components)
    {
      if (obj.exchange.cache.hasOwnProperty(id)) {

        if (fetch_components) {

          if (obj.exchange.cache[id].hasOwnProperty('components')) {

            logger.debug('Found record ' + id + ' from cache');
            return [obj.exchange.cache[id]].concat(obj.exchange.cache[id].components);

          } else {
            return [];
          }

        } else {
          return new MarcRecord(obj.exchange.cache[id]);
        }

      } else {
        return [];
      }
    }
    
    function removeRecordFromCache(cache, id)
    {

      return utils.undefineProperties(cache, records.reduce(function(product, record) {
        
        var id = record.get(/^001$/).shift().value;
        
        return cache.hasOwnProperty(id) && cache[id].hasOwnProperty('components') ?
          product.concat(id, cache[id].components) : product.concat(id);
        
      }, []));

    }

    
    function writeRecordToCache(cache, record)
    {

      return Object.defineProperty(cache, record.get(/^001$/).shift().value, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: new MarcRecord(record)
      });

    }    

    return Object.assign(obj, {
      exchange: {
        cache: {}
      },
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
      },
      rollback: function(transaction)
      {

        function deleteCreated()
        {
          return obj.delete(transaction.created);
        }

        function restoreUpdated()
        {
          return obj.update({
            idList: transaction.updated.map(getRecordId)
          }, transaction.updated);
        }

        function restoreDeleted()
        {
          return obj.create(transaction.deleted);
        }

        return deletedCreated().then(restoreUpdated).then(restoreDeleted);

      },
      /**
       * @param {MarcRecord|MarcRecord[]} record_data - A single MarcRecord instance or an array of records
       * @returns {Promise} A Promise that resolves with an array of ids of the created records
       */
      create: function(record_data)
      {

        function process(list, results)
        {

          var record = list.shift();

          function createRecord()
          {
            return melinda_client.create(record).then(function(result) {              
              return result.errors.length > 0 ?
                Promise.reject(new Error(result.errors.join()))
                : process(list, results.concat(result.recordId));
            });
          }

          results = results || {
            idList: []
          };

          return record ? createRecord().catch(function(error) {

            return fn_handle_error(error, createRecord);

          }) : Promise.resolve(results);

        }

        return process(Array.isArray(record_data) ? record_data : [record_data]); 

      },
      /**
       * @param {object} query
       * @param {string[]} query.idList - An array of record ids
       * @param {boolean} [query.fetchComponents=false] - Fetches component records if set to true. The host record is always the first record in the returned set
       * @returns {Promise} A Promise that resolves with an array of MarcRecord instances
       */
      read: function(query)
      {

        var fn_get_records, fn_get_records_cache;

        function pump(list, results)
        {

          var id = list.shift();

          function getRecords(id)
          {

            var cache_records = parameters.useCache ? fn_get_records_cache(id) : [];

            return cache_records.length > 0 ?
              Promise.resolve(results.concat(cache_records))
              : fn_get_records(id).then(function(records) {

                if (parameters.useCache) {
                  records.forEach(function(record) {
                    obj.exchange.cache = writeRecordToCache(obj.exchange.cache, record);
                  });
                }

                return results.concat(records);

              });

          }

          results = results || [];
          
          return id ? getRecords(id).catch(function(error) {            
            return fn_handle_error(error, function() {
              return getRecords(id);
            });
          }) : Promise.resolve(results);

        }

        if (typeof query === 'object' && Array.isArray(query.idList)) {

          fn_get_records_cache = query.fetchComponents ? readRecordFromCache : function(id) {
            return getRecordsFromCache(id, true);
          };
          fn_get_records = query.fetchComponents ? function(id) {
            return melinda_client.loadChildRecords(id, {
              include_parent: 1
            });
          } : melinda_client.loadRecord;
          
          return pump(query.idList);

        } else {
          return Promise.reject(new Error('Invalid query object'));
        }

      },
      /**
       * @param {object} query
       * @param {string[]} query.idList - An array of record ids
       * @param {MarcRecord|MarcRecord[]} record_data - A single MarcRecord instanceof or an array of records
       * @returns {Promise} A Promise that resolves with an array of MarcRecord instances representing the records before update
       */
      update: function(query, record_data)
      {

        function process(list, results)
        {

          var data = list.shift();

          function updateRecord()
          {
            return melinda_client.update(data.new).then(function(result) {              
              if (result.errors.length > 0) {

                return Promise.reject(new Error(result.errors.join()));

              } else {

                if (parameters.useCache) {
                  obj.exchange.cache = removeRecordFromCache(obj.exchange.cache, data.new.get(/^001$/).shift().value);
                }

                return process(list, results.concat(data.old));

              }
            });
          }

          results = results || [];

          return data ? updateRecord().catch(function(error) {

            return fn_handle_error(error, updateRecord);

          }) : Promise.resolve(results);

        }

        record_data = Array.isArray(record_data) ? record_data : [record_data];

        if (typeof query !== 'object' || Array.isArray(query.idList)) {
          return Promise.reject('Invalid query object');
        } else if (query.idList.length === record_data.length) {
          return Promise.reject('Number of record ids does not match the number of record data');
        } else {
          return obj.read({
            idList: record_data.map(getRecordId)
          }).then(function(records) {
            return process(record_data.map(function(record_new, index) {
              return {
                old: records[index],
                new: record_new
              };
            }));
          });
        }

      },
      /*
       * @param {object} query
       * @param {string[]} query.idList - An array of record ids
       * @returns {Promise} A Promise that resolves with an array of MarcRecord instances representing the records which were deleted
       */
      delete: function(query)
      {
        return obj.read(query).then(function(records) {

          records = records.map(function(record) {

            record.appendField({
              tag: 'STA',
              subfields: [{
                code: 'a',
                value: 'DELETED'
              }]
            });

            return record;

          });

          return obj.update(query, records).then(function() {
            return records;
          });

        });
      }
    });

  };

}
