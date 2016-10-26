/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related modules for recordLoader
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
      'es6-polyfills/lib/polyfills/promise',
      'marc-record-js',
      'marc-record-converters',
      'record-loader-prototypes/lib/result-formatter/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('marc-record-js'),
      require('marc-record-converters'),
      require('record-loader-prototypes/lib/result-formatter/prototype')
    );
  }

}(this, factory));

function factory(Object, Promise, MarcRecord, marc_record_converters, resultFormatterFactory)
{
  
  'use strict';

  /**
   * @readonly
   * @enum {number}
   */
  var CONVERSIONS = {
    id: 1,
    marc: 2
  },
  RESULT_LEVELS = resultFormatterFactory.getLevels();

  /**
   * @param {object} parameters
   * @param {number} [parameters.convert] - Optional conversion of record data. Records can be converted to record ids or to different MARC data formats. See {@link CONVERSIONS} for the values to use. Requires 'parameters.properties' to be set.
   * @param {string} [parameters.format] - If parameters.convert is set to CONVERSION.marc this parameters defined the MARC format to convert to. See {@link module:marc-record-converters|marc-record-converters} for available formats
   * @param {string[]} [parameters.properties] - An array of property names to convert, i.e. 'matchedRecords', 'record'. If the value is an array, each element is converted
   */
  return function(parameters)
  {
    
    var logger, fn_convert,
    obj = resultFormatterFactory();

    parameters = typeof parameters === 'object' ? parameters : {};    

    if (!parameters.convert || Object.keys(CONVERSIONS).some(function(key) {
      return CONVERSIONS[key] === parameters.convert;
    })) {    

      if (!Array.isArray(parameters.properties)) {
        throw new Error("Parameters 'properties' is not an array");
      } else if (parameters.convert === CONVERSIONS.marc && !marc_record_converters.hasOwnProperty(parameters.format)) {
        throw new Error("No converter found for format '" + parameters.format + "'");
      } else {

        fn_convert = !parameters.convert ? function(record) {
          return record;
        } : parameters.convert === CONVERSIONS.id ? function(record_data) {
          
          function convert(record)
          {
            return new MarcRecord(record).get(/^001$/).shift().value;
          }
          
          return Array.isArray(record_data) ? record_data.map(convert) : convert(record_data);
          
        } : function(record_data) {
          
          function convert(record)
          {
            return marc_record_converters[parameters.format].convertTo(new MarcRecord(record));
          }

          return Array.isArray(record_data) ? record_data.map(convert) : convert(record_data);
          
        };
        
        return Object.assign(obj, {
          setLogger: function(logger_arg)
          {
            logger = logger_arg;
            return obj;
          },
          run: function(results)
          {
            try {
              return Promise.resolve(results.hasOwnProperty('records') && parameters.convert ? Object.assign(results, {
                records: results.records.map(function(result) {

                  return Object.keys(result).reduce(function(product, key) {

                    return Object.defineProperty(product, key, {
                      writable: true,
                      configurable: true,
                      enumerable: true,
                      value: parameters.properties.indexOf(key) >= 0 ? fn_convert(result[key]) : result[key]
                    });
                    
                  }, {});
                  
                })
              }) : results);
            } catch (e) {
              return Promise.reject(e);
            }
          }
        });

      }

    } else {
      throw new Error('Invalid conversion target');
    }

  };

}
