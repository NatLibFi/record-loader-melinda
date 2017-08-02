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
      '../../../processors/preprocess/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/object'),
      require('../../../processors/preprocess/melinda')
    );
  }

}(this, factory));

function factory(Object, processorFactory) {

  'use strict';

  return function(parameters)
  {

    var obj = processorFactory(parameters),
    fn_set_logger = obj.setLogger,
    fn_proto_run = obj.run;

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        fn_set_logger(logger_arg);
				return obj;
      },
      run: function(record)
      {
        return fn_proto_run(record.record).then(function(result) {
	  return Object.assign(result, {
            record: Object.assign(record, {
              record: result.record
            })
          });
        });
      }
    });
 
  };

}
