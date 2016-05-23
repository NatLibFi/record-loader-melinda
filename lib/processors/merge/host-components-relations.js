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
      'es6-polyfills/lib/polyfills/object',
      'record-loader-marc/lib/processors/merge/marc',
	    'marc-record-validators-melinda',
      'jjv',
      'jjve',
      '../../../resources/processor-merge-host-components-relations-config-schema.json',
      'record-loader-marc/resources/processor-merge-marc-schema.json',
      'record-loader-marc/node_modules/marc-record-rank/resources/configuration-schema.json',
      'record-loader-marc/node_modules/marc-record-merge/resources/configuration-schema.json',
    	'marc-record-validators-melinda/node_modules/marc-record-validate/resources/configuration-schema.json'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('record-loader-marc/lib/processors/merge/marc'),
	    require('marc-record-validators-melinda'),
      require('jjv'),
      require('jjve'),
      require('../../../resources/processor-merge-host-components-relations-config-schema.json'),
      require('record-loader-marc/resources/processor-merge-marc-schema.json'),
      require('record-loader-marc/node_modules/marc-record-rank/resources/configuration-schema.json'),
      require('record-loader-marc/node_modules/marc-record-merge/resources/configuration-schema.json'),
      require('marc-record-validators-melinda/node_modules/marc-record-validate/resources/configuration-schema.json')
    );
  }

}(this, factory));

function factory(Object, protoFactory, validateFactory, jjv, jjve, schema, schema_proto, schema_record_rank, schema_record_merge, schema_record_validate)
{
  
  'use strict';

  return function(parameters)
  {

    var fn_set_converter_proto, fn_set_logger_proto, fn_run_proto, fn_validate_record, proto, logger;

    function validateParameters()
    {
      
	    var errors;
	    var env = jjv();
	    var je = jjve(env);
	    
      env.addSchema(schema.properties.validation.$ref, schema_record_validate);
	    env.addSchema(schema_proto.properties.rank.anyOf[0].$ref, schema_record_rank);
	    env.addSchema(schema_proto.properties.merge.$ref, schema_record_merge);
      env.addSchema(schema.properties.merging.$ref, schema_proto);
      
	    errors = env.validate(schema, parameters, {
		    useDefault: true
	    });
	    
	    if (errors) {
		    throw new Error(JSON.stringify(je(schema, parameters, errors), undefined, 4));
	    }
      
    }

    validateParameters();

    proto = protoFactory(parameters.merging);
    fn_set_converter_proto = proto.setConverter;
    fn_set_logger_proto = proto.setLogger;
    fn_run_proto = proto.run;

    if (parameters.validation) {
      fn_validate_record = validateFactory(parameters.validation);
    }

    proto.setLogger = function(logger_arg)
    {
      logger = logger_arg;
      fn_set_logger_proto(logger);
    };

    proto.setConverter = function(converter_arg)
    {
      fn_set_converter_proto({
        convert: function(record)
        {
          return record.hasOwnProperty('record') && record.hasOwnProperty('recordStoreHost') ? record.record : record;
        }
      });
    };

    proto.run = function(record, matched_records)
    {
      return fn_run_proto(record, matched_records).then(function(results) {

        results = [
          {
            record: results.shift(),
            recordStoreHost: record.recordStoreHost
          },
          results.shift(),
          {
            merge: results.shift()
          }
        ];

        if (fn_validate_record) {

          logger.info('Validating the merged record');
          logger.debug('Input record: ' + JSON.stringify(results[0].record.toJsonObject(), undefined, 4));


          return fn_validate_record(results[0].record).then(function(results_validation) {

            results[2].validate = results_validation;

            if (results_validation.failed) {

              logger.error('Merged record is invalid');
              throw new Error(results);

            } else {
              return results;
            }

          });

        } else {
          return results;
        }

      });
    };

    return proto;
  };

}
