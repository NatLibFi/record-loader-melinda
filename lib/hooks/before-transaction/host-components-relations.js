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
        define([
	    'es6-polyfills/lib/promise',
	    'loglevel',
	    'record-loader-prototypes/lib/hooks/prototype'
	], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
	    require('es6-polyfills/lib/promise'),
	    require('loglevel'),
	    require('record-loader-prototypes/lib/hooks/prototype')
	);
    }

}(this, factory));

function factory(Promise, log, protoFactory)
{
    
    'use strict';

    return function(treshold)
    {

	function compareComponents(records_record_set, records_record_store)
	{

	    function getComponentsLength(records)
	    {
		return records.filter(function(record) {
		    return record.get(/^773$/).length > 0;
		}).length;
	    }

	    var result = {
		recordSet: getComponentsLength(records_record_set),
		recordStore: getComponentsLength(records_record_store)
	    };

	    result.difference = Math.abs(result.recordSet - result.recordStore);
	    
	    if (result.recordSet.length === result.recordStore.length
		|| result.recordSet.length === 0 && result.recordStore.length > 0
		|| result.recordSet.length > 0 && result.recordStore.length === 0
	       ) {
		result.ok = 1;
	    } else {
		result.ok = (treshold - result.difference) >= 0;
	    }

	    return result;

	}

	var record_store, record_set, converter,
	proto = protoFactory();	

	treshold = typeof treshold === 'number' ? treshold : 0;

	proto.run = function(records) {
	    
	    var record_store_host = records[0].data.recordStoreHost;

	    records = records.map(function(record) {
		return record.data.record;
	    });

	    if (records.length === 0) {
		return Promise.resolve();
	    } else {
		return record_store.read(record_store_host, 1).then(function(found_records) {

		    var result = compareComponents(records, found_records);

		    if (result.ok) {
			log.debug(result);
			return Promise.resolve();
		    } else {
			log.error(result);
			return Promise.reject(new Error('Host-components records from record set differ too much from corresponding record store records'));
		    }
		    
		});
	    }

	};
	
	proto.setRecordStore =  function(record_store_arg)
	{
	    record_store = record_store_arg;
	};

	proto.setRecordSet = function(record_set_arg)
	{
	    record_set = record_set_arg;
	};
	
	proto.setConverter = function(converter_arg)
	{
	    converter = converter_arg;
	};

	return proto;

    };

}