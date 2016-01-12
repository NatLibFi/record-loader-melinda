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
        define(['es6-polyfills/lib/polyfills/promise', 'marc-record-js', 'record-loader-prototypes/lib/processors/load/prototype'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('es6-polyfills/lib/polyfills/promise'), require('marc-record-js'), require('record-loader-prototypes/lib/processors/load/prototype'));
    }

}(this, factory));

function factory(Promise, MarcRecord, protoFactory)
{

    'use strict';

   return function(parameters) {

       var converter, record_store, results_level,
       proto = protoFactory();
       
       proto.run =function(record, options)
       {
	   return Promise.reject('Not implemented');
       };

       proto.setRecordStore = function(record_store_arg)
       {
	   record_store = record_store_arg;
       };

       proto.setConverter = function(converter_arg)
       {
	   converter = converter_arg;
       };

       proto.setResultsLevel = function(results_level_arg)
       {
	   results_level = results_level_arg;
       }

       return proto;

   };

}