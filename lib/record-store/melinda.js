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
        define(['es6-polyfills/lib/promise', 'es6-polyfills/lib/object', 'marc-record-js', 'jjv', 'jjve', 'melinda-cpi-client', 'sru-client', 'marc-record-serializers/lib/MARCXML', '../../resources/record-store-melinda-config-schema.json'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('es6-polyfills/lib/promise'), require('es6-polyfills/lib/object'), require('marc-record-js'), require('jjv'), require('jjve'), require('melinda-api-client'), require('sru-client'), require('marc-record-serializers/lib/MARCXML'), require('../../resources/record-store-melinda-config-schema.json'));
    }

}(this, factory));

function factory(Promise, Object, MarcRecord, jjv, jjve, MelindaClient, createSruClient, MARCXML, schema)
{

    'use strict';

    return function(parameters) {

	var sru_client, melinda_client;

	function validateConfig()
	{

	    var env = jjv();
	    var je = jjve();
	    var errors = env.validate(schema, parameters, {
		useDefault: true
	    });

	    if (errors) {
		throw new Error(JSON.stringify(je(schema, parameters, errors), undefined, 4));
	    }

	}

	function getMelindaRecords(id_list, records)
	{
	    
	    var id = id_list.shift();

	    records = records ? records : [];

	    if (id === undefined) {
		return records;
	    } else {		
		return melinda_client.loadRecord(id).then(function(record) {	    
		    records.push(record);
		    return getMelindaRecords(id_list, records);
		});
	    }

	}

	function getSruRecords(query, records, start_record)
	{
	    
	    records = records ? records : [];

	    return sru_client.searchRetrieve(query, start_record).then(function(results) {
		
		records = records.concat(results.records);

		if (results.nextRecordPosition) {
		    return getSruRecords(query, records, results.nextRecordPosition);
		} else {
		    return records;
		}

	    });

	}

	validateConfig();

	Object.assign(parameters.sru, {
	    recordSchema: 'marcxml'
	});

	sru_client = createSruClient(parameters.sru);
	melinda_client = new MelindaClient(parameters.melinda);

	return {
	    'create': function(record, options)
	    {
		return Promise.reject('Not implemented');
	    },
	    'read': function(query)
	    {
		return getSruRecords(query).then(function(records) {
		    return getMelindaRecords(records.map(function(record) {
			return MARCXML.fromMARCXML(record).get(/^001$/)[0].value;
		    }));
		});
	    },
	    'update': function(query, record, options)
	    {
		return Promise.reject('Not implemented');
	    },
	    'delete': function(query)
	    {
		return Promise.reject('Not implemented');
	    },
	    'toggleTransaction': function(toggle)
	    {
		return Promise.reject('Not implemented');
	    },
	    'rollback': function()
	    {
		return Promise.reject('Not implemented');
	    }
	};

    };

}