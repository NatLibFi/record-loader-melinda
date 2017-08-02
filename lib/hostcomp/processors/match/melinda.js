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
      '../../../processors/match/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/object'),
      require('../../../processors/match/melinda')
    );
  }

}(this, factory));

function factory(Object, processorFactory) {

  'use strict';

  return function(parameters)
  {

    var fn_read_record_store, host_id,
    obj = processorFactory(parameters),
    fn_proto_set_read_record_store = obj.setReadRecordStore,
    fn_proto_run = obj.run;

    return Object.assign(obj, {
      findMatchCandidates: function(record)
      {
        return fn_read_record_store({
          idList: [host_id],
          fetchComponents: true
        });
      },
      setReadRecordStore: function(fn_read_record_store_arg)
      {
        fn_read_record_store = fn_read_record_store_arg;
        fn_proto_set_read_record_store(fn_read_record_store_arg);
        return obj;
      },
      run: function(record)
      {
        host_id = record.melindaHostId;
        return fn_proto_run(record.record);
      }
    });

  };

}
