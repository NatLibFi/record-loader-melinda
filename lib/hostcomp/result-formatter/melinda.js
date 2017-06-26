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
      'es6-polyfills/lib/polyfills/object',
      'es6-polyfills/lib/polyfills/promise',
      'record-loader-prototypes/lib/result-formatter/prototype',
      '../../result-formatter/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('record-loader-prototypes/lib/result-formatter/prototype'),
      require('../../result-formatter/melinda')
    );
  }

}(this, factory));

function factory(Object, Promise, resultFormatterPrototypeFactory, resultFormatterFactory)
{
  
  'use strict';

  var RESULT_LEVELS = resultFormatterPrototypeFactory.getLevels();
  
  return function(parameters)
  {

    var level,
    obj = resultFormatterFactory(parameters),
    fn_proto_set_level = obj.setLevel,
    fn_proto_run = obj.run;
    
    return Object.assign(obj, {
      setLevel: function(level_arg)
      {
        level = level_arg;
        return fn_proto_set_level(level);
      },
      /**
       * Passes only the actual record data to the prototype function but doesn't convert it back because we don't need the hostcomp represenation anymore at this point
       */
      run: function(results)
      {
        return fn_proto_run(level & RESULT_LEVELS.recordData ? Object.assign(results, {
          records: results.records.map(function(result) {
            
            return Object.assign(result, result.hasOwnProperty('record') ? {
              record: result.record.record
            } : {});
            
          })
        }) : results);
      }
    });
    
  };

}
