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
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'marc-record-js',
      'marc-record-validators-melinda',
      'record-loader-prototypes/lib/processors/preprocess/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
	    require('marc-record-js'),
	    require('marc-record-validators-melinda'),
      require('record-loader-prototypes/lib/processors/preprocess/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, MarcRecord, validateFactory, processorFactory) {

  'use strict';

  return function(parameters) {

    var logger,
    fn_validate = validateFactory(Object.assign(typeof parameters === 'object' ? JSON.parse(JSON.stringify(parameters)) : {}, {
      fix: true,
      failOnError: true
    })),
    obj = processorFactory();

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      run: function(record)
      {
        
        logger.info('Validating and fixing the record');
        
        record = new MarcRecord(record);

        return fn_validate(record).then(function(result) {

          logger.debug('Fix results: ' + JSON.stringify(result, undefined, 4));
          
          return result.failed ? /* istanbul ignore next: Not easily tested with current validators */ Promise.reject(result) : {
            record: record.toJsonObject(),
            preprocessDetails: result
          };

        });

      }
    });
 
  };

}
