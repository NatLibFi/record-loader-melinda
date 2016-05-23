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
      'marc-record-js',
      'record-loader-prototypes/lib/processors/preprocess/prototype',
	    'marc-record-validators-melinda',
      'jjv',
      'jjve',
      '../../../resources/processor-preprocess-marc-record-validate-config-schema.json',
      'marc-record-validate/resources/configuration-schema.json'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('marc-record-js'),
      require('record-loader-prototypes/lib/processors/preprocess/prototype'),
	    require('marc-record-validators-melinda'),
      require('jjv'),
      require('jjve'),
      require('../../../resources/processor-preprocess-marc-record-validate-config-schema.json'),
      require('marc-record-validate/resources/configuration-schema.json')
    );
  }

}(this, factory));

function factory(Object, MarcRecord, protoFactory, validateFactory, jjv, jjve, schema, validate_schema)
{
  
  'use strict';

  return function(parameters)
  {

    function isCloneOf(obj, base)
    {
	    return !Object.keys(base).some(function(key) {
	      return !(obj.hasOwnProperty(key) && (typeof base[key] !== 'function' || typeof obj[key] === 'function'));
	    });
    }

    function validateParameters()
    {

      var errors,
      env = jjv(),
      je = jjve(env);

      env.addSchema(schema.properties.validators.$ref, validate_schema.properties.validators);
      
      parameters = typeof parameters === 'object' ? parameters : {};
      errors = env.validate(schema, parameters, {
        useDefault: true
      });

      if (errors) {

        /**
         * @todo Workaround for https://github.com/silas/jjve/issues/12
         **/
        schema.properties.validators = validate_schema.properties.validators;
        
        throw new Error('Parameters are invalid: ' + JSON.stringify(je(schema, parameters, errors), undefined, 4));

      }

    }

    var fn_validate, logger, converter;
    
    validateParameters();
    
    if (parameters.validators) {      
      fn_validate = validateFactory(Object.assign(parameters, {
        fix: true,
        failOnError: false
      }));
    }
    
    return Object.assign(protoFactory(), {
      run: function(record)
      {

        logger.info('Validating and fixing the record');
        
        record =  isCloneOf(record, new MarcRecord()) ? record : new MarcRecord(converter.convert(record));

        return !fn_validate ? Promise.resolve([record]) : fn_validate(record).then(function(results) {
          
          logger.debug('Fix results: ' + JSON.stringify(results, undefined, 4));
          
          return [record, results];
          
        });
      },
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
      },
      setConverter: function(converter_arg)
      {
        converter = converter_arg;
      }
    });

  };

}
