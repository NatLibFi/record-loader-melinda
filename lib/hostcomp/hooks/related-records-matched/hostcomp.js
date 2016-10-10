/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'marc-record-js',
      'merge',
      'record-loader-prototypes/lib/hooks/related-records-matched/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('marc-record-js'),
      require('merge'),
      require('record-loader-prototypes/lib/hooks/related-records-matched/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, MarcRecord, mergeObjects, hookFactory)
{
  
  'use strict';

  /**
   * @param {object} parameters
   * @param {boolean} parameters.findMissingByIndex - Attempts to find matches for records based on the index of the record id (001-field). Example: There is no match for record 124 but there are matches for records 123, 125 and their corresponding matches have ids 1500 and 1502. Therefore it is assumed that the match for record set record 124 is 1501 in the record store
   * @param {object} parameters.difference - Denotes the maximum number of extraneous components that are allowed. If the number components exceeds the value the processing is aborted
   * @param {number} parameters.difference.recordSet - Maximum number of extraneous components to allow for the record set
   * @param {number} parameters.difference.recordStore - Maximum number of extraneous components to allow for the record store
   * @param {object} parameters.onFailure - Force creating records in the record store when the check for corresponding records fail
   * @param {boolean} parameters.onFailure.updateEmptyHost - Create all components from the record set in the record store as new and set them as components of the record store host
   * @param {boolean} parameters.onFailure.createAsNew - Create all records as new in the record store
   */
  return function(parameters)
  {

    var logger, record_store,
    obj = hookFactory();

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      setRecordStore: function(record_store_arg)
      {
        record_store = record_store_arg;
        return obj;
      },
      run: function(records)
      {
        return record_store.read({

          idList: [records[0].melindaHostId],
          fetchComponents: true
          
        }).then(function(records_store) {

          function normalizeMatches(records)
          {

            function mapNoop(record)
            {
              return record;
            }

            /**
             * Remove matched records that already are a singular match for _one_ other record
             */
            function removeMultiMatches(record)
            {

              var removed_matches = [];

              record =  Object.assign(record, {
                matchedRecords: record.matchedRecords.filter(function(matched_record) {

                  var found_matches,
                  matched_record_stringified = JSON.stringify(matched_record.record);
                  
                  if (record.matchedRecords.length > 0) {
                    
                    found_matches = records.filter(function(other_record) {
                      return other_record !== record && other_record.matchedRecords.length === 1 && JSON.stringify(other_record.matchedRecords[0]) === matched_record_stringified;
                    });
                    
                    if (found_matches.length === 1) {

                      removed_matches.push(matched_record);
                      return false;

                    } else {
                      return true;
                    }
                    
                  } else {
                    return true;
                  }
                  
                })
              });

              return mergeObjects.recursive(true, record, removed_matches.length > 0 ? {
                relatedRecordsMatchedHook: {
                  normalization: {
                    multiMatchesRemoved: removed_matches
                  }
                }
              } : {});

            }

            function checkMultiMatches(records)
            {

              records = records.map(function(record) {
                return Object.assign(record, record.matchedRecords.length > 1 ? {
                  failed: true,
                  message: 'Multiple matches not allowed'
                } : {});
              });       

              return records.some(function(record) {
                return record.failed;
              }) ? Promise.reject(records) : Promise.resolve(records);

            }

            /**
             * Check if there is a single record in the set that has no matches. If it is the host, set the record store host as it's match. Otherwise set a single matchless record in the record store side as it's match
             */
            function findMissing(record)
            {

              var record_store;

              if (record.matchedRecords.length === 0 && !records.some(function(record_other) {
                return record_other !== record && record_other.matchedRecords.length > 0;
              })) {
                
                record_store = records_store.filter(function(record) {
                  return record.matchedRecords.length === 0;
                }).shift();
  
                if (record_store) {

                  record.matchedRecords = record.get(/^773$/).length === 0 ? [records_store[0]] : record_store ? [record_store] : [];
                  record = mergeObjects(true, record, {
                    normalization: {
                      foundMissing: true
                    }
                  });

                }

              }

              return record;

            }

            /**
             * Attempt to find a match for a record based on it's index and the indexes of the surrounding records in correspondence to the record store indexes
             */
            function findMissingByIndex(record, index, records)
            {
              
              function getSurroundingRecords(id)
              {
                return records.filter(function(record_other) {
                  return record_other.matchedRecords.length === 1 && (new MarcRecord(record_other).get(/^001$/).value()).indexOf([id + 1, id - 1]) >= 0;
                });
              }
              
              function findMatch(surrounding_records)
              {
                
                var record_store_ids = surrounding_records.map(function(record) {
                  return record.matchedRecords[0].get(/^001$/).shift().value;
                });

                return record_store_ids[1] - record_store_ids[0] === 1 ? records_store.filter(function(record_store) {
                  
                  var record_store_stringified = JSON.stringify(record.toJsonObject());
                  
                  return record_store.get(/^001$/).shift().value === record_store_ids[0] + 1 && !records.some(function(record) {
                    return record.matchedRecords.length === 1 && JSON.stringify(record.matchedRecords[0]) === record_store_stringified;
                  });

                }).reduce(function(product, record) {

                  return product.length === 0 ? product.concat(record) : product;

                }, []) : [];

              }

              if (record.matchedRecords.length === 0) {

                record = Object.assign(record, {
                  matchedRecords: findMatch(getSurroundingRecords(new MarcRecord(record.record).get(/^001$/).shift().value))
                });

                return mergeObjects.recursive(true, record, record.matchedRecords.length === 1 ? {
                  normalization: {
                    foundMissingByIndex: true
                  }
                } : {});

              } else {
                return record;
              }

            }

            function checkMatchless(records)
            {

              records = records.map(function(record) {
                return Object.assign(record, record.matchedRecords.length === 0 ? {
                  failed: true,
                  message: 'Records without matches not allowed'
                } : {});
              });

              return records.some(function(record) {
                return record.failed;
              }) ? Promise.reject(records) : Promise.resolve(records);

            }

            return checkMultiMatches(records.map(removeMultiMatches)).then(function(records) {
              return checkMatchless(records.map(findMissing).map(parameters.findMissingByIndex ? findMissingByIndex : mapNoop));
            });

          }

          function checkDifference(records)
          {

            var result = {},
            difference = records.length - records_store.length;

            if (parameters.difference.recordSet && difference > 0) {
              result = {
                failed: true,
                message: 'Too many extraneous input records in the host-component set'                
              };
            } else if (parameters.difference.recordStore && difference < 0) {
              result = {
                failed: true,
                message: 'Too many extraneous record store records in the host-component set'
              };
            }

            records = records.map(function(record) {
              return Object.assign(record, result);
            });

            return result.failed ? Promise.reject(records) : Promise.resolve(records);

          }

          try {

            return normalizeMatches(records)
              .then(checkDifference)
              .catch(function(records) {
                
                //TODO
                return Promise.reject(records);

              });

          } catch (error) {
            return Promise.reject(error);
          }

        });                                                            
      }
    });

  };

}
