/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2016 University Of Helsinki (The National Library Of Finland)
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
      'marc-record-js',
      'record-loader-marc/lib/result-formatters/marc'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('marc-record-js'),
      require('record-loader-marc/lib/result-formatters/marc')
    );
  }

}(this, factory));

function factory(MarcRecord, protoFactory)
{
  
  'use strict';

  return function(parameters)
  {

    var proto = protoFactory(parameters),
    fn_proto_data = proto.data;

    proto.data = function(record, results_level, type)
    {

      return fn_proto_data(type === 'output' ? new MarcRecord(record.record) : record.record, results_level, type);
    };
    
    return proto;

  };

}
