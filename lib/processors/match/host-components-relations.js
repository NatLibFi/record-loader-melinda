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
      'loglevel',
      'jjv',
      'jjve',
      'marc-record-js',
      'record-loader-json/lib/processors/match/json-similarity',
      'marc-record-rank/lib/rank',
      '../../../resources/processor-match-host-components-relations-config-schema',
      'json-similarity/resources/spec-schema',
      'json-path-transformations/resources/transformations-schema',
      'marc-record-rank/resources/configuration-schema'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('loglevel'),
      require('jjv'),
      require('jjve'),
      require('marc-record-js'),
      require('record-loader-json/lib/processors/match/json-similarity'),
      require('marc-record-rank/lib/rank'),
      require('../../../resources/processor-match-host-components-relations-config-schema'),
      require('json-similarity/resources/spec-schema'),
      require('json-path-transformations/resources/transformations-schema'),
      require('marc-record-rank/resources/configuration-schema')
    );
  }

}(this, factory));

function factory(Promise, log, jjv, jjve, MarcRecord, protoFactory, rankFactory, schema, json_similarity_schema, json_path_transformations_schema, marc_record_rank_schema)
{
  
  'use strict';

  return function(parameters)
  {

    function getBestRecords(records)
    {

      function iterate(records)
      {

        var record_pair, result;

        if (records.length > 1) {

          record_pair = records.splice(0, 2);
          result = fn_rank.apply(undefined, record_pair);
          
          logger.debug('Record ' + record_pair[result >= 0 ? 0 : 1].get(/^001$/).shift().value + ' ranks better than ' + record_pair[result >= 0 ? 1 : 0].get(/^001$/).shift().value);

          return iterate(result >= 0 ? record_pair.slice(0, 1).concat(records) : record_pair.slice(1, 2).concat(records));

        } else {        
          return records.slice(0, 1);
        }

      }
      
      logger.info('Ranking the best record');

      return iterate(records);

    }

    function validateConfig()
    {
      
      var errors;
      var env = jjv();
      var je = jjve(env);
      
      env.addSchema(schema.properties.rank.$ref, marc_record_rank_schema);
      env.addSchema(schema.properties.matching.$ref, json_similarity_schema);
      
      errors = env.validate(schema, parameters, {
        useDefault: true
      });
      
      if (errors) {

        /**
         * @todo Workaround for https://github.com/silas/jjve/issues/12
         **/
        schema.properties.rank = marc_record_rank_schema;
        schema.properties.matching = json_similarity_schema;

        throw new Error(JSON.stringify(je(schema, parameters, errors), undefined, 4));

      }

    }
    
    var record_store, logger, converter, proto, fn_run_proto, fn_set_converter_proto, fn_set_logger_proto, fn_rank, last_found_candidates;

    validateConfig();

    proto = protoFactory(parameters.matching);
    fn_run_proto = proto.run;
    fn_set_converter_proto = proto.setConverter;
    fn_set_logger_proto = proto.setLogger;
    
    if (parameters.rank) {
      fn_rank = rankFactory(parameters.rank);
    }

    proto.setConverter = function(converter_arg)
    {
      converter = converter_arg;
      fn_set_converter_proto({
        convert: function(record)
        {
          return record.record.toJsonObject();
        }
      });
    };

    proto.setLogger = function(logger_arg)
    {
      logger = logger_arg;
      fn_set_logger_proto(logger);
    };

    proto.setRecordStore = function(record_store_arg)
    {
      record_store = record_store_arg;
    };

    proto.findMatchCandidates = function(record)
    {
      return record_store.read(record.recordStoreHost, 1).then(function(found_records) {

        last_found_candidates = found_records.map(function(found_record) {
          return found_record.toJsonObject();
        });

        return last_found_candidates;

      });
    };

    proto.run = function(record)
    {

      logger.info('Finding matches for input record ' + record.record.get(/^001$/)[0].value);

      return fn_run_proto(record).then(function(results) {    
        return results.map(function(value, index) {
          switch (index) {
          case 0:
            return {
              record: new MarcRecord(value),
              recordStoreHost: record.recordStoreHost
            };
          case 1:

            value = value.map(function(obj) {
              return new MarcRecord(obj);
            });

            return typeof fn_rank === 'function' ? getBestRecords(value) : value;

          default:
            return value.reduce(function(results_additional, result, index_result) {

              var id = new MarcRecord(last_found_candidates[index_result]).get(/^001$/)[0].value;

              results_additional[id] = result;
              
              return results_additional;

            }, {});
          }
        });
      });

    };

    return proto;

  };

}

