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
        define(['es6-polyfills/lib/polyfills/promise', 'mimemessage', 'marc-record-js', 'marc-record-converters', 'record-loader-prototypes/lib/record-set/prototype'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('es6-polyfills/lib/polyfills/promise'), require('mimemessage'), require('marc-record-js'), require('marc-record-converters'), require('record-loader-prototypes/lib/record-set/prototype'));
    }

}(this, factory));

function factory(Promise, mimemessage, MarcRecord, marc_record_converters, protoFactory) {

    'use strict';

    return function(getData)
    {

	function parseMimeMessage(data)
	{

	    var obj = {};
	    var message = mimemessage.parse(data);

	    if (message) {
		if (message.isMultiPart()) {

		    message.body.forEach(function(message_child) {
			
			var type = message_child.header('Content-Host-Components-Relations-Type');

			if (type) {

			    obj[type] = message_child.body;

			    if (type === 'data') {
				switch(message_child.contentType().fulltype) {
				case 'application/marcxml+xml':
				    obj.dataFormat = 'marcxml';
				    break;
				case 'application/vnd.melinda.aleph-sequential':
				    obj.dataFormat = 'alephsequential';
				    break;
				default:
				    throw new Error('Unsupported data content type: ' + message_child.contentType().value);
				}
			    }

			}

		    });

		    if (!obj.hasOwnProperty('id') || !obj.hasOwnProperty('data') || !obj.hasOwnProperty('dataFormat')) {
			throw new Error('MIME message is missing mandatory child messages');
		    }

		    return obj;

		} else {
		    throw new Error('MIME message is not multipart');
		}
	    } else {
		throw new Error('Invalid MIME message');
	    }
	    
	}

	return function(parameters) {
	    
	    var record_store_host_id, find_related_records,
	    proto = protoFactory(),
	    offset = 0,
	    records = [];
	    
	    proto.initialise = function(input_data, find_related_records_arg)
	    {
		
		function getRecords()
		{
		    return reader.read().then(function(result) {
			if (result.done) {
			    return Promise.resolve();
			} else {
			    records.push(result.value);
			    return getRecords();
			}
		    });
		}
		
		var reader;
		
		find_related_records = find_related_records_arg;
		
		return getData(input_data).then(function(result) {
		    
		    result = parseMimeMessage(result);
		    record_store_host_id = result.id;

		    reader = marc_record_converters[result.dataFormat].createReader(result.data);
		    return getRecords();

		});
		
	    };
	    
	    proto.next = function()
	    {

		function createRecordData(record, index)
		{
		    return {
			index: index,
			data: {
			    record: new MarcRecord(JSON.parse(JSON.stringify(record.toJsonObject()))),
			    recordStoreHost: record_store_host_id
			}
		    };
		}

		var next_record;

		if (records[offset] === undefined) {
		    return Promise.resolve(undefined);
		} else {
		    if (find_related_records) {
			
			offset++;
			
			return Promise.resolve(
			    records.map(function(record, index) {
				if (index === offset - 1) {
				    next_record = createRecordData(record, index);
				    return;
				} else {
				    return createRecordData(record, index);
				}
			    }).filter(function(element) {
				return element !== undefined;
			    }).concat(next_record).reverse()
			);
			
		    } else {
			
			return Promise.resolve({
			    index: offset,
			    data: {
				record: records[offset++],
				recordStoreHost: record_store_host_id
			    }
			});
			
		    }
		}
	    };	    

	    return proto;

	};
	
    };

};