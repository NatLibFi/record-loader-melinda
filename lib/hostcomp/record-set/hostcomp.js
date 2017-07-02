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
      '@natlibfi/es6-polyfills/lib/polyfills/object',
      '@natlibfi/marc-record-converters',
      '@natlibfi/record-loader-prototypes/lib/record-set/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/object'),
      require('@natlibfi/marc-record-converters'),
      require('@natlibfi/record-loader-prototypes/lib/record-set/prototype')
    );
  }

}(this, factory));

function factory(Object, marc_record_converters, recordSetFactory)
{
  
  'use strict';

//Set the format in parameters instead of data
  return function(parameters)
  {

    var logger, bundle, sent,
    obj = {};
    
    return Object.assign(obj, recordSetFactory(), {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      initialize: function(bundle_arg)
      {

        function initializeBundle()
        {

          function convertRecords(str, format)
          {
            return marc_record_converters.hasOwnProperty(format) ? (function() {

              bundle.records = marc_record_converters[format].from(str).map(function(record) {
                return record.toJsonObject();
              });

              return Promise.resolve();
              
            })() : Promise.reject(new Error('Unsupported format: ' + format));
          }

          bundle = Object.assign({}, bundle_arg);
          return Array.isArray(bundle_arg.records) ? Promise.resolve() : convertRecords(bundle.records, bundle.format);

        }

        return typeof bundle_arg === 'object' && typeof bundle_arg.melindaHostId === 'string' && (typeof bundle_arg.records === 'string' || Array.isArray(bundle_arg.records)) ?
          initializeBundle() : Promise.reject(new Error('Invalid bundle'));

      },
      get: function()
      {
        return Promise.resolve(sent ? undefined : function() {
          
          sent = 1;

          return bundle.records.map(function(record) {
            return {
              melindaHostId: bundle.melindaHostId,
              record: record
            };
          });

        }());
      }
    });

  };

}
