/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2015-2016 University Of Helsinki (The National Library Of Finland)
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
      'marc-record-js',
      'jjv/lib/jjv',
      'jjve',
      'jxon',
      'melinda-cpi-client',
      'sru-client',
      'aleph-x-query',
      'marc-record-converters/lib/nodejs',
      'record-loader-prototypes/lib/record-store/prototype',
      'requirejs-plugins/src/json!../../resources/record-store-melinda-config-schema.json'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('marc-record-js'),
      require('jjv'),
      require('jjve'),
      require('jxon'),
      require('melinda-api-client'),
      require('sru-client'),
      require('aleph-x-query'),
      require('marc-record-converters/lib/nodejs'),
      require('record-loader-prototypes/lib/record-store/prototype'),
      require('../../resources/record-store-melinda-config-schema.json')
    );
  }

}(this, factory));


function factory(Promise, Object, MarcRecord, jjv, jjve, jxon, MelindaClient, createSruClient, AlephX, marc_record_converters, protoFactory, schema)
{

  'use strict';

  return function(parameters) {

    function validateConfig()
    {

      var env = jjv();
      var je = jjve();
      var errors = env.validate(schema, parameters, {
        useDefault: true
      });

      if (errors) {
        throw new Error(JSON.stringify(je(schema, parameters, errors), undefined, 4));
      }

    }

    function callMelindaApi(id, params)
    {

      function handleResponse(record_data)
      {

        var id_host;

        if (parameters.melinda.cache) {       
          if (Array.isArray(record_data)) {

            id_host = record_data[0].get(/^001$/)[0].value;

            melinda_cache[id_host] = {
              data: record_data[0],
              components: []
            };

            record_data.slice(1).forEach(function(record) {

              var id_component = record.get(/^001$/)[0].value;

              melinda_cache[id_host].components.push(id_component);
              melinda_cache[id_component] = {
                data: record
              };
            });

            return [new MarcRecord(melinda_cache[id_host].data)].concat(melinda_cache[id_host].components.map(function(id_component) {
              return new MarcRecord(melinda_cache[id_component].data);
            }));

          } else {

            id_host = record_data[0].get(/^001$/)[0].value;

            melinda_cache[id_host] = {
              data: record_data
            };

            return new MarcRecord(melinda_cache[id_host].data);
            
          }
        } else {
          return record_data;
        }
      }

      if (parameters.melinda.cache === true && melinda_cache.hasOwnProperty(id) === true) {
        if (typeof params === 'object' && params.include_parent) {
          return Promise.resolve(
            [new MarcRecord(melinda_cache[id].data)].concat(melinda_cache[id].components.map(function(id_component) {
              return new MarcRecord(melinda_cache[id_component].data);
            }))
          );
        } else {
          return Promise.resolve(new MarcRecord(melinda_cache[id].data));
        }
      } else {
        return typeof params === 'object' && params.include_parent ? melinda_client.loadChildRecords(id, params).then(handleResponse) : melinda_client.loadRecord(id, params).then(handleResponse);
      }

    }

    function getMelindaRecords(id_list, get_components, records)
    {

      function call(resolveCallback, rejectCallback)
      {
        callMelindaApi(id, client_params).then(function(result) {

          records = !Array.isArray(result) && result.leader.length === 0 && result.fields.length === 0 || Array.isArray(result) && result.length === 0
            ? records : records.concat(result);
          
          resolveCallback(getMelindaRecords(id_list, get_components, records));

        }).catch(function(error) {
          try {
            /**
             * @todo The explicit check of onError should not be needed. Mandatory (Default values defined) properties in the config should be created automatically. JJV's useDefault does not fill in the values in all cases.
             */
            if (typeof parameters.melinda.onError === 'object' && (parameters.melinda.onError.retry === true || retries++ <= parameters.melinda.onError.retry)) {
              
              logger.info('Melinda API call failed. Retrying (Error: ' + error.message + ')');
              
              if (typeof parameters.melinda.onError.waitSeconds === 'number') {
                
                logger.info('Retrying in ' + parameters.melinda.onError.waitSeconds + ' seconds.');
                
                setTimeout(function() {
                  call(resolveCallback, rejectCallback);
                }, parameters.melinda.onError.waitSeconds);
              } else {
                call(resolveCallback, rejectCallback);
              }
              
            } else {
              rejectCallback(error);
            }
          } catch (e) {
            rejectCallback(e);
          }       
        });
      }
      
      var id = id_list.shift(),
      retries = 0,
      client_params = !get_components ? {} : {
        include_parent: 1
      };

      records = records ? records : [];

      if (id === undefined) {
        return Promise.resolve(records);
      } else {
        return new Promise(call);
      }
      
    }

    function sruReadFactory()
    {
      
      function getSruRecords(query, records, start_record)
      {
        
        records = records ? records : [];
        
        return sru_client.searchRetrieve(query, start_record).then(function(results) {
          
          records = records.concat(results.records);
          
          if (results.nextRecordPosition) {
            return getSruRecords(query, records, results.nextRecordPosition);
          } else {
            return records;
          }
          
        });
        
      }

      var sru_client;
      
      Object.assign(parameters.sru, {
        recordSchema: 'marcxml'
      });
      
      sru_client = createSruClient(parameters.sru);
      
      return function(query, get_components)
      {

        function getRecords(resolveCallback, rejectCallback)
        {

          getSruRecords(query).then(function(records) {
            resolveCallback(getMelindaRecords(
              records.map(function(record) {
                return marc_record_converters.marcxml.convertFrom(jxon.stringToXml(record))
                  .shift()
                  .get(/^001$/)[0].value;
              }),
              get_components
            ));

          }).catch(function(error) {

            if (parameters.sru.onError.retry === true || retries++ <= parameters.sru.onError.retry) {

              logger.info('SRU call failed. Retrying (Error: ' + error.message + ')');

              if (typeof parameters.sru.onError.waitSeconds === 'number') {

                logger.info('Retrying in ' + parameters.sru.onError.waitSeconds + ' seconds.');

                setTimeout(function() {
                  getRecords(resolveCallback, rejectCallback);
                }, parameters.sru.onError.waitSeconds);

              } else {
                getRecords(resolveCallback, rejectCallback);
              }

            } else {
              rejectCallback(error);
            }

          });
          
        }
        
        var retries = 0;

        if (typeof query === 'string') {
          return new Promise(getRecords);
        } else {
          return Promise.reject(new Error('Query must be a string'));
        }

      };

    }

    function alephXReadFactory()
    {

      var aleph_x_client = new AlephX(parameters.alephX);
      
      return function(query, get_components)
      {

        function getRecords(resolveCallback, rejectCallback)
        {
          aleph_x_client.query(parameters.alephX.base, query.index, query.term).then(function(records) {
            
            resolveCallback(!get_components ? records : getMelindaRecords(records.map(function(record) {
              return record.get(/^001$/)[0].value;
            }), 1));

          }).catch(function(error) {

            if (parameters.alephX.onError.retry === true || retries++ <= parameters.alephX.onError.retry) {

              logger.info('Aleph X-service call failed. Retrying (Error: ' + error.message + ')');

              if (typeof parameters.alephX.onError.waitSeconds === 'number') {

                logger.info('Retrying in ' + parameters.alephX.onError.waitSeconds + ' seconds.');

                setTimeout(function() {
                  getRecords(resolveCallback, rejectCallback);
                }, parameters.alephX.onError.waitSeconds);

              } else {
                getRecords(resolveCallback, rejectCallback);
              }

            } else {
              rejectCallback(error);
            }

          });
        }

        var retries = 0;

        if (typeof query !== 'object' || query.index === undefined || query.term === undefined) {
          return Promise.reject(new Error('Invalid query'));
        } else {        
          return new Promise(getRecords);
        }
      };

    }

    var fn_read_records, melinda_client, melinda_cache, transaction_results, transaction_enabled, logger,
    proto = protoFactory();
    
    validateConfig();

    melinda_client = new MelindaClient(parameters.melinda);

    if (parameters.hasOwnProperty('sru')) {
      fn_read_records = sruReadFactory();
    } else if (parameters.hasOwnProperty('alephX')) {
      fn_read_records = alephXReadFactory();
    } else {

      melinda_cache = {};

      fn_read_records = function(query, get_components) {
        return getMelindaRecords(
          Array.isArray(query) ? query : [query],
          get_components
        );
      };

    }

    proto.read = function(query, get_components)
    {
      return fn_read_records(query, get_components);
    };

    proto.create = function(record)
    {
      return melinda_client.createRecord(record).then(function(response) {
        return melinda_client.loadRecord(response.recordId).then(function(record_from_store) {

          if (transaction_enabled) {
            transaction_results.created[response.recordId] = new MarcRecord(record_from_store);
          }
          
          return {
            created: [record_from_store]
          };
          
        });
      });
    };

    proto.update = function(query, record, options)
    {
      return fn_read_records(query).then(function(records) {

        var record_from_store;

        if (records.length === 0) {
          throw new Error('No records found with update query: ' + JSON.stringify(query));
        } else if (records.length > 1) {
          throw new Error('Found ' + records.length + ' records with update query instead of one. Cannot update.');
        } else {

          record_from_store = records.shift();

          return melinda_client.updateRecord(record_from_store.get(/^001$/).shift().value, record).then(function(response) {
            return melinda_client.loadRecord(response.recordId).then(function(record_updated) {

              if (transaction_enabled) {
                transaction_results.updated[response.recordId] = record_from_store;
              }

              return {
                updated: [record_updated]
              };

            });
          });

        }
      });
    };

    proto['delete'] = function(query)
    {
      return fn_read_records(query).then(function(records) {

        var record_from_store, record_from_store_original;

        if (records.length === 0) {
          throw new Error('No records found with delete query: ' + JSON.stringify(query));
        } else if (records.length > 1) {
          throw new Error('Found ' + records.length + ' records with delete query instead of one. Cannot delete.');
        } else {
          
          record_from_store_original = records.shift();
          record_from_store = new MarcRecord(record_from_store_original);

          record_from_store.appendField({
            tag: 'STA',
            subfields: [{
              code: 'a',
              value: 'DELETED'
            }]
          });

          return melinda_client.updateRecord(record_from_store.get(/^001$/).shift().value, record_from_store).then(function(response) {

            if (transaction_enabled) {
              transaction_results.deleted[response.recordId] = record_from_store_original;
            }

            return {
              deleted: [record_from_store]
            };

          });
          
        }

      });
    };

    proto.toggleTransaction = function(toggle)
    {

      transaction_enabled = toggle;
      transaction_results = {
        created: {},
        deleted: {},
        updated: {}
      };

    };

    proto.rollback = function()
    {

      function iterate()
      {

        var id, record_update,
        operation = Object.keys(transaction_results).shift();

        if (operation === undefined) {        
          return Promise.resolve();
        } else {

          id = Object.keys(transaction_results[operation]).shift();

          if (id === undefined) {

            delete transaction_results[operation];

            return iterate();
            
          } else {

            switch (operation) {
            case 'created':

              record_update = transaction_results[operation][id];

              record_update.appendField({
                tag: 'STA',
                subfields: [{
                  code: 'a',
                  value: 'DELETED'
                }]
              });
              
              return melinda_client.updateRecord(id, transaction_results[operation][id]).then(function(response) {

                delete transaction_results[operation][id];

                return iterate();

              });
              
            case 'updated':

              record_update = transaction_results[operation][id];
              
              return melinda_client.updateRecord(id, transaction_results[operation][id]).then(function(response) {

                delete transaction_results[operation][id];

                return iterate();

              });

            case 'deleted':

              record_update = transaction_results[operation][id];

              record_update.fields.some(function(field, index) {

                if (field.tag === 'STA' && field.subfields.some(function(subfield) {
                  return subfield.code === 'a' && subfield.value === 'DELETED';
                })) {

                  record_update.fields.splice(index, 1);
                  return 1;

                }

              });
              
              return melinda_client.updateRecord(id, record_update).then(function(response) {

                delete transaction_results[operation][id];

                return iterate();

              });

            default:
              break;
            }

          }

        }

      }

      return iterate();

    };

    proto.setLogger = function(logger_arg)
    {
      logger = logger_arg;
    };

    return proto;

  };

}
