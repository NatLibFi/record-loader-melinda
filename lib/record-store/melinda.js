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
	    'es6-polyfills/lib/object',
	    'marc-record-js',
	    'jjv',
	    'jjve',
	    'jxon',
	    'melinda-cpi-client',
	    'sru-client',
	    'aleph-x-query',
	    'marc-record-converters/lib/nodejs',
	    'record-loader-prototypes/lib/record-store/prototype',
	    '../../resources/record-store-melinda-config-schema.json'
	], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
	    require('es6-polyfills/lib/promise'),
	    require('es6-polyfills/lib/object'),
	    require('marc-record-js'),
	    require('jjv'),
	    require('jjve'),
	    require('jxon'),
	    require('melinda-api-client'),
	    require('sru-client'),
	    require('aleph-x-query'),
	    require('marc-record-converters/lib/nodejs'),
	    require('record-loader-prototypes/lib/record-store/prototype'),
	    require('../../resources/record-store-melinda-config-schema.json')
	);
    }

}(this, factory));


function factory(Promise, Object, MarcRecord, jjv, jjve, jxon, MelindaClient, createSruClient, AlephX, marc_record_converters, protoFactory, schema)
{

    'use strict';

    return function(parameters) {

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

	function callMelindaApi(id, params)
	{

	    function handleResponse(record_data)
	    {

		var id_host;

		if (parameters.melinda.cache) {		    
		    if (Array.isArray(record_data)) {

			id_host = record_data[0].get(/^001$/)[0].value;

			melinda_cache[id_host] = {
			    data: record_data[0],
			    components: []
			};

			record_data.slice(1).forEach(function(record) {

			    var id_component = record.get(/^001$/)[0].value;

			    melinda_cache[id_host].components.push(id_component);
			    melinda_cache[id_component] = {
				data: record
			    };
			});

			return [new MarcRecord(melinda_cache[id_host].data)].concat(melinda_cache[id_host].components.map(function(id_component) {
			    return new MarcRecord(melinda_cache[id_component].data);
			}));

		    } else {

			id_host = record_data[0].get(/^001$/)[0].value;

			melinda_cache[id_host] = {
			    data: record_data
			};

			return new MarcRecord(melinda_cache[id_host].data);
			
		    }
		} else {
		    return record_data;
		}
	    }

	    if (parameters.melinda.cache === true && melinda_cache.hasOwnProperty(id) === true) {
		if (typeof params === 'object' && params.include_parent) {
		    return Promise.resolve(
			[new MarcRecord(melinda_cache[id].data)].concat(melinda_cache[id].components.map(function(id_component) {
			    return new MarcRecord(melinda_cache[id_component].data);
			}))
		    );
		} else {
		    return Promise.resolve(new MarcRecord(melinda_cache[id].data));
		}
	    } else {
		return typeof params === 'object' && params.include_parent ? melinda_client.loadChildRecords(id, params).then(handleResponse) : melinda_client.loadRecord(id, params).then(handleResponse);
	    }

	}

	function getMelindaRecords(id_list, get_components, records)
	{
	    
	    var id = id_list.shift(),
	    client_params = !get_components ? {} : {
		include_parent: 1
	    };

	    records = records ? records : [];

	    if (id === undefined) {
		return Promise.resolve(records);
	    } else {
		return callMelindaApi(id, client_params).then(function(result) {
		    records = !Array.isArray(result) && result.leader.length === 0 && result.fields.length === 0 || Array.isArray(result) && result.length === 0
			? records : records.concat(result);

		    return getMelindaRecords(id_list, get_components, records);
		});
	    }
	    
	}

	function sruReadFactory()
	{
	    
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

	    var sru_client;
	    
	    Object.assign(parameters.sru, {
		recordSchema: 'marcxml'
	    });
	    
	    sru_client = createSruClient(parameters.sru);
	    
	    return function(query, get_components)
	    {
		if (typeof query === 'string') {
		    return getSruRecords(query).then(function(records) {
			return getMelindaRecords(
			    records.map(function(record) {
				return marc_record_converters.marcxml.convertFrom(jxon.stringToXml(record))
				    .shift()
				    .get(/^001$/)[0].value;
			    }),
			    get_components
			);
		    });
		} else {
		    return Promise.reject(new Error('Query must be a string'));
		}
	    };

	}

	function alephXReadFactory()
	{

	    var aleph_x_client = new AlephX(parameters.alephX);
	   
	    return function(query, get_components)
	    {
		if (typeof query !== 'object' || query.index === undefined || query.term === undefined) {
		    return Promise.reject(new Error('Invalid query'));
		} else {		    
		    return aleph_x_client.query(parameters.alephX.base, query.index, query.term).then(function(records) {

			return !get_components
			    ? records
			    : getMelindaRecords(
				records.map(function(record) {
				    return record.get(/^001$/)[0].value;
				}),
				1
			    );
		    });
		}
	    };

	}

	var fn_read_records, melinda_client, melinda_cache,
	proto = protoFactory();

	validateConfig();

	melinda_client = new MelindaClient(parameters.melinda);

	if (parameters.hasOwnProperty('sru')) {
	    fn_read_records = sruReadFactory();
	} else if (parameters.hasOwnProperty('alephX')) {
	    fn_read_records = alephXReadFactory();
	} else {

	    melinda_cache = {};

	    fn_read_records = function(query, get_components) {
		return getMelindaRecords(
		    Array.isArray(query) ? query : [query],
		    get_components
		);
	    };

	}

	proto.create = function(record, options)
	{
	    return Promise.reject('Not implemented');
	};
	    
	proto.read = function(query, get_components)
	{
	    return fn_read_records(query, get_components);
	};

	proto.update = function(query, record, options)
	{
	    return Promise.reject('Not implemented');
	};

	proto['delete'] = function(query)
	{
	    return Promise.reject('Not implemented');
	};

	proto.toggleTransaction = function(toggle)
	{
	    return Promise.reject('Not implemented');
	};

	proto.rollback = function()
	{
	    return Promise.reject('Not implemented');
	};

	return proto;

    };

}
