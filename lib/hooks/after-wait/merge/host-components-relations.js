/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2016 University Of Helsinki (The National Library Of Finland)
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
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'es6-shims/lib/shims/array',
      'marc-record-js',
      'loglevel',
      'jjv',
      'jjve',
      'record-loader-prototypes/lib/hooks/prototype',
      '../../../../resources/hook-after-wait-merge-host-components-relations-schema.json'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('es6-shims/lib/shims/array'),
      require('marc-record-js'),
      require('loglevel'),
      require('jjv'),
      require('jjve'),
      require('record-loader-prototypes/lib/hooks/prototype'),
      require('../../../../resources/hook-after-wait-merge-host-components-relations-schema.json')
    );
  }

}(this, factory));

function factory(Promise, Object, shim_array, MarcRecord, log, jjv, jjve, protoFactory, schema)
{
  
  'use strict';

  return function(parameters)
  {

    function validateParameters()
    {

      var env = jjv(),
      je = jjve(env),
      errors = env.validate(schema, parameters, {
        useDefault: true
      });

      if (errors) {
        throw new Error('Invalid parameters: ' + JSON.stringify(je(schema, parameters, errors), undefined, 4));
      }

    }

    var record_store, record_set, converter, logger, record_loader_results,
    proto = protoFactory(); 

    parameters = typeof parameters === 'object' ? parameters : {};

    validateParameters();

    return Object.assign(proto, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
      },
      setRecordStore: function(record_store_arg)
      {
        record_store = record_store_arg;
      },
      setRecordSet: function(record_set_arg)
      {
        record_set = record_set_arg;
      },
      setConverter: function(converter_arg)
      {
        converter = converter_arg;
      },
      setResults: function(results_arg)
      {
        record_loader_results = results_arg;
      },
      run: function(results) {

        function applyDetails(key, index, data)
        {

          if (!details.records.hasOwnProperty(index)) {
            details.records[index] = {};
          }

          if (!details.records[index].hasOwnProperty(key)) {
            details.records[index][key] = data;
          } else {
            Object.assign(details.records[index][key], data);
          }

        }
        
        /**
         * @internal Attempts to remove extraneous, obsolete matches and find missing ones
         **/
        function normalizeMatches(records_store)
        {

          function removeMultimatches()
          {

            /**
             * @internal Remove matches that already are a singular match for some other record
             **/
            results_obj.results.forEach(function(result1) {

              var records_removed = [],
              found_indexes = [];

              if (result1.matches.length > 1) {
                
                result1.matches.forEach(function(record_matched, index) {

                  var record_matched_string = JSON.stringify(record_matched.toJsonObject());

                  results_obj.results.some(function(result2) {
                    
                    if (result2 !== result1 && result2.matches.length === 1 && record_matched_string === JSON.stringify(result2.matches[0].toJsonObject()))
                      
                      if (found_indexes.indexOf(index) >= 0) {
                        found_indexes.splice(found_indexes.indexOf(index), 1);
                        return true;
                      } else {
                        found_indexes.push(index);
                      }
                    
                  });
                });
                
                if (found_indexes.length > 0) {

                  result1.matches = result1.matches.filter(function(element, index) {
                    if (found_indexes.indexOf(index) < 0) {
                      records_removed.push(element);
                    } else {
                      return 1;
                    }
                  });

                  applyDetails(result1.index, 'normalization', {
                    multimatchesRemoved: records_removed
                  });

                  logger.debug('Removed multimatches from record ' + result1.index);


                }

              }

            });

          }

          function findMissing()
          {

            var found_index_results, found_index_store;

            /**
             * @internal Only continue if there is a single record without any matches
             **/
            if (!results_obj.results.some(function(result, index) {
              if (result.matches.length === 0) {
                
                if (found_index_results === undefined) {
                  found_index_results = index;
                } else {
                  return true;
                }

              }
            }) && found_index_results !== undefined) {

              /**
               * @internal If the single unmatching record is a host match it to the record store host
               **/
              if (results_obj.results[found_index_results].record.get(/^773$/).length === 0) {

                results_obj.results[found_index_results].matches.push(shim_array.find(records_store, function(record) {

                  return record.get(/^001$/)[0].value === results_obj.recordStoreHost;
                  
                }));

                logger.debug('Found the missing match (Host) for record ' + results_obj.results[found_index_results].index);
                
                applyDetails(results_obj.results[found_index_results].index, 'normalization', {
                  singleMissingMatchFound: true
                });       

                /**
                 * @internal Check that there is only one missing record in the store
                 **/
              } else if (!records_store.some(function(record, index) {

                var record_matchless_string = JSON.stringify(record.toJsonObject());

                if (!results_obj.results.some(function(result) {
                  
                  return result.matches.map(function(record) {
                    return JSON.stringify(record.toJsonObject());
                  }).some(function(record_string) {
                    return record_string === record_matchless_string;
                  });     
                  
                })) {

                  if (found_index_store === undefined) {
                    found_index_store = index;
                  } else {
                    return true;
                  }

                }

              }) && found_index_store !== undefined) {
                
                results_obj.results[found_index_results].matches.push(records_store[found_index_store]);
                
                logger.debug('Found the missing match for record ' + results_obj.results[found_index_results].index);
                
                applyDetails(results_obj.results[found_index_results].index, 'normalization', {
                  singleMissingMatchFound: true
                });
                
              }
              
            }

          }

          /**
           * @internal Attempts to find matches based on record id index
           */
          function findMissingByIndex()
          {
            results_obj.results.forEach(function(result, index) {

              var id, id_prev_store, id_next_store, record_store_match;

              if (result.matches.length === 0) {

                id = Number(result.record.get(/^001$/).shift().value);

                if (results_obj.results.some(function(result_some) {
                  
                  var id_other;

                  if (result_some !== result && result_some.matches.length === 1) {

                    id_other = Number(result_some.record.get(/^001$/).shift().value);

                    if (id_other === id - 1) {
                      id_prev_store = Number(result_some.matches[0].get(/^001$/).shift().value);
                    } else if (id_other === id + 1) {
                      id_next_store = Number(result_some.matches[0].get(/^001$/).shift().value);
                    }

                    if (id_prev_store !== undefined && id_next_store !== undefined) {
                      return 1;
                    }

                  }

                })) {

                  record_store_match = shim_array.find(records_store, function(record) {

                    var id_store = Number(record.get(/^001$/).shift().value);

                    return id_prev_store === id_store - 1 && id_next_store === id_store + 1;

                  });

                  if (record_store_match) {

                    result.matches.push(record_store_match);

                    logger.debug('Found the missing match for record ' + results_obj.results[index].index + ' by record id index');

                    applyDetails(results_obj.results[index].index, 'normalization', {
                      foundMissingByIndex: record_store_match.toJsonObject()
                    });
                    
                  }
                  
                }

              }

            });
          }

          removeMultimatches();

          if (results_obj.results.some(function(result) {
            return result.matches.length > 1;
          })) {
            throw new Error('Multimatches not allowed');
          } else {

            if (parameters.findMissingByIndex === true && results_obj.results.some(function(result) {
              return result.matches.length > 0;
            })) {
              findMissingByIndex();
            }

            findMissing();
            
            if (results_obj.results.some(function(result) {
              return result.matches.length === 0;
            })) {
              throw new Error('Records without matches not allowed');
            }

          }

        }

        /**
         * @internal Check is there are too many extraneous records in either side (record set / store)
         **/
        function checkDifference(records_store)
        {

          function testTreshold(key)
          {
            if (typeof parameters.difference[key] !== 'number' || Math.abs(details.difference) > parameters.difference[key]) {          
              throw new Error('Too many extraneous records between corresponding host-component sets');
            }
          }

          details.difference = results_obj.results.length - records_store.length;

          logger.debug('Records in set: ' + results_obj.results.length + ', records in store: ' + records_store.length);
          
          if (details.difference < 0) {
            testTreshold('recordStore');
          } else if (details.difference > 0) {
            testTreshold('recordSet');
          }

        }

        var details, results_obj;

        if (!record_loader_results.hasOwnProperty('hooks')) {
          record_loader_results.hooks = {};
        }

        if (!record_loader_results.hooks.hasOwnProperty('afterWait')) {
          record_loader_results.hooks.afterWait = {};
        }

        record_loader_results.hooks.afterWait.merge = {
          records: {}
        };

        details = record_loader_results.hooks.afterWait.merge;
        results_obj = {
          recordStoreHost: results[0].results.data.input.recordStoreHost,
          results: results.map(function(result) {
            
            return {
              record: result.stepResults[0].record,
              index: result.results.index,
              matches: result.stepResults[1]
            };

          })
        };

        /**
         * @internal Get the corresponding records from the store
         **/
        return record_store.read(results_obj.recordStoreHost, 1).then(function(records_store) {

          normalizeMatches(records_store);
          checkDifference(records_store);

          /**
           * @internal Update 'matched' property
           **/
          results.forEach(function(result) {
            result.results.matched = result.stepResults[1].map(function(record) {
              return new MarcRecord(record);
            });            
          });

        });

      }
    });

  };

}
