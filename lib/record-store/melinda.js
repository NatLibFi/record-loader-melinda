/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related modules for recordLoader
 *
 * Copyright (c) 2015-2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of record-loader-melinda
 *
 * record-loader-melinda is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *  
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      '@natlibfi/es6-polyfills/lib/polyfills/promise',
      '@natlibfi/es6-polyfills/lib/polyfills/object',
      '@natlibfi/melinda-api-client',
      'marc-record-js',
      '@natlibfi/record-loader-prototypes/lib/record-store/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/es6-polyfills/lib/polyfills/object'),
      require('@natlibfi/melinda-api-client'),
      require('marc-record-js'),
      require('@natlibfi/record-loader-prototypes/lib/record-store/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, MelindaClient, MarcRecord, recordStoreFactory) {

  'use strict';

  function normalizeRecordId(id)
  {
    return id.replace(/^[0]+/, '');
  }

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

    var logger, obj, melinda_client, fn_handle_error;
    
		parameters = typeof parameters === 'object' ? parameters : {};    
    obj = recordStoreFactory();
		melinda_client = new MelindaClient({
      endpoint: parameters.url,
      user: parameters.user,
      password: parameters.password
    });
    fn_handle_error = typeof parameters.retry === 'number' ? function(error, callback) {
      return new Promise(function(resolveCallback, rejectCallback) {
        function reject() 
        {
          rejectCallback(Object.assign(new Error(JSON.stringify(error)), {
            internalError: error
          }));
        }
        
        setTimeout(function() {
          callback().then(resolveCallback, reject);
        }, parameters.retry);
      });    
    } : function(error) {
      return Promise.reject(Object.assign(new Error(JSON.stringify(error)), {
        internalError: error
      }));
    };
		
    function readRecordFromCache(id, fetch_components)
    {
      id = normalizeRecordId(id);
      
      if (obj.exchange.cache.hasOwnProperty(id)) {        
        if (fetch_components) {
          if (obj.exchange.cache[id].hasOwnProperty('components')) {
            logger.debug('Found record ' + id + ' from cache');
            return [obj.exchange.cache[id].record].concat(obj.exchange.cache[id].components);
          } else {
            return [];
          }
        } else {
          logger.debug('Found record ' + id + ' from cache');
          return new MarcRecord(obj.exchange.cache[id].record);
        }
      } else {
        return [];
      }
    }
    
    function removeRecordFromCache(cache, id)
    {
      var id_list = [];
      
      id = normalizeRecordId(id);
      
      id_list.push(id);
        
      if (cache.hasOwnProperty(id) && cache[id].hasOwnProperty('components')) {
        id_list.concat(cache[id].components.map(function(record) {
          return normalizeRecordId(getRecordId(record));
        }));
      }
          
      id_list.forEach(function(id) {
        delete cache[id];
      });
      
      return cache;
    }
    
    function writeRecordToCache(cache, record, components)
    {
      var data = {
        record: new MarcRecord(record)
      };
      
      if (components) {
        data.components = components;
      }
      
      return Object.defineProperty(cache, normalizeRecordId(record.get(/^001$/).shift().value), {
        configurable: true,
        enumerable: true,
        writable: true,
        value: data
      });
    }    

    return Object.assign(obj, {
      exchange: {
        cache: {}
      },
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
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

        return deleteCreated().then(restoreUpdated).then(restoreDeleted);

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
            return melinda_client.createRecord(record).then(function(result) {
              return process(list, {
                idList: results.idList.concat(result.recordId)
              });
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
            cache_records = Array.isArray(cache_records) ? cache_records : [cache_records];

            return cache_records.length > 0 ?
              Promise.resolve(results.concat(cache_records))
              : fn_get_records(id).then(function(records) {
                
                records = Array.isArray(records) ? records : [records];
                
                if (parameters.useCache) {
                  if (records.length > 1) {
                    records.reverse();
                    records.forEach(function(record, index, arr) {
                      if (index == arr.length - 1) {
                        obj.exchange.cache = writeRecordToCache(obj.exchange.cache, record, records.slice(0, -1)); 
                      } else {
                        obj.exchange.cache = writeRecordToCache(obj.exchange.cache, record);
                      }
                    });
                    records.reverse();
                  } else {
                    obj.exchange.cache = writeRecordToCache(obj.exchange.cache, records[0]);
                  }
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

          fn_get_records_cache = query.fetchComponents ? function(id) {
            return readRecordFromCache(id, true);
          } : readRecordFromCache;
          fn_get_records = query.fetchComponents ? function(id) {
            return melinda_client.loadChildRecords(id, {
              include_parent: 1
            });
          } : melinda_client.loadRecord;
          
          return pump(query.idList.slice());

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
            return melinda_client.updateRecord(data.new).then(function(result) {              
              if (parameters.useCache) {
                obj.exchange.cache = removeRecordFromCache(obj.exchange.cache, data.new.get(/^001$/).shift().value);
              }
              
              return process(list, results.concat(data.old));
            });
          }

          results = results || [];

          return data ? updateRecord().catch(function(error) {

            return fn_handle_error(error, updateRecord);

          }) : Promise.resolve(results);

        }

        record_data = Array.isArray(record_data) ? record_data : [record_data];

        if (typeof query !== 'object' || !Array.isArray(query.idList)) {
          return Promise.reject(new Error('Invalid query object'));
        } else if (query.idList.length !== record_data.length) {
          return Promise.reject(new Error('Number of record ids does not match the number of record data'));
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
              ind1: ' ',
              ind2: ' ',
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
