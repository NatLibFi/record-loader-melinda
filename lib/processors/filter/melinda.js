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
      '@natlibfi/record-loader-prototypes/lib/processors/filter/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/es6-polyfills/lib/polyfills/object'),
      require('@natlibfi/record-loader-prototypes/lib/processors/filter/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, processorFactory) {

  'use strict';

  return function() {

    var logger,
    obj = processorFactory();

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      run: function(record)
      {
        var result = {
          passes: record.fields.some(function(field) {
            return field.tag === '001';
          })
        };
          
        if (!result.passes) {
          result.filterDetails = 'The record is missing 001-field';
          logger.debug('The record is missing 001-field');
        }
                
        return Promise.resolve(result);
      }
    });

  };

}
