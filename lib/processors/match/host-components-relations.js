/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2015 University Of Helsinki (The National Library Of Finland)
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
	    'es6-polyfills/lib/promise',
	    'loglevel',
	    'jjv',
	    'jjve',
	    'record-loader-json/lib/processors/match/json-similarity',
	    'json-similarity/resources/spec-schema'
	], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
	    require('es6-polyfills/lib/promise'),
	    require('loglevel'),
	    require('jjv'),
	    require('jjve'),
	    require('record-loader-json/lib/processors/match/json-similarity'),
	    require('json-similarity/resources/spec-schema')
	);
    }

}(this, factory));

function factory(Promise, log, jjv, jjve, match_prototype, schema)
{
    
    'use strict';

    return function(parameters)
    {

	var record_store, converter, proto, fn_set_converter_proto;

	proto = match_prototype(parameters);
	fn_set_converter_proto = proto.setConverter;

	proto.setConverter = function(converter_arg)
	{
	    converter = converter_arg;
	    fn_set_converter_proto(converter);
	};

	proto.setRecordStore = function(record_store_arg)
	{
	    record_store = record_store_arg;
	};

	proto.findMatchCandidates = function(record)
	{
	    return record_store.read(record.recordStoreHost, 1).then(function(found_records) {
		return found_records.map(function(found_record) {
		    return {
			record: found_record
		    };
		});
	    });
	};

	return proto;

    };

}

