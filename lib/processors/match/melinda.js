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
	    'es6-polyfills/lib/polyfills/promise',
	    'jsonpath',
	    'loglevel',
	    'jjv',
	    'jjve',
	    'marc-record-js',
	    'json-path-transformations',
	    'object-comparison',
	    'record-loader-json/lib/processors/match/json-similarity',
	    '../../../resources/processor-match-melinda-config-schema',
	    'json-similarity/resources/spec-schema',
	    'json-path-transformations/resources/transformations-schema',
	    'marc-record-rank/resources/configuration-schema'
	], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
	    require('es6-polyfills/lib/polyfills/promise'),
	    require('jsonpath'),
	    require('loglevel'),
	    require('jjv'),
	    require('jjve'),
	    require('marc-record-js'),
	    require('json-path-transformations'),
	    require('object-comparison'),
	    require('record-loader-json/lib/processors/match/json-similarity'),
	    require('../../../resources/processor-match-melinda-config-schema'),
	    require('json-similarity/resources/spec-schema'),
	    require('json-path-transformations/resources/transformations-schema'),
	    require('marc-record-rank/resources/configuration-schema')
	);
    }

}(this, factory));

function factory(Promise, jsonpath, log, jjv, jjve, MarcRecord, json_path_transformer, objectCompare, protoFactory, schema, json_similarity_schema, json_path_transformations_schema, marc_record_rank_schema)
{
    
    'use strict';

    function isCloneOf(obj, base)
    {
	return !Object.keys(base).some(function(key) {
	    return !(obj.hasOwnProperty(key) && (typeof base[key] !== 'function' || typeof obj[key] === 'function'));
	});
    }

    return function(parameters)
    {

	function validateConfig()
	{
	    
	    var errors;
	    var env = jjv();
	    var je = jjve(env);
	    
	    env.addSchema(schema.properties.rank.$ref, marc_record_rank_schema);
	    env.addSchema(schema.properties.matching.$ref, json_similarity_schema);
	    env.addSchema(schema.properties.matchCandidatesQuery.items.properties.transformations.$ref, json_path_transformations_schema);

	    errors = env.validate(schema, parameters, {
		useDefault: true
	    });
	    
	    if (errors) {
		throw new Error(JSON.stringify(je(schema, parameters, errors), undefined, 4));
	    }

	}

	function getBestRecords(records)
	{

	    function iterate(records)
	    {

		var record_pair, result;

		if (records.length > 1) {

		    record_pair = records.splice(0, 2);
		    result = fn_rank.apply(undefined, record_pair);
		    
		    logger.debug('Record ' + record_pair[result >= 0 ? 0 : 1].get(/^001$/).shift().value + ' ranks better than ' + record_pair[result >= 0 ? 1 : 0].get(/^001$/).shift().value);

		    return iterate(result >= 0 ? record_pair.slice(0, 1).concat(records) : record_pair.slice(1, 2).concat(records));

		} else {		    
		    return records.slice(0, 1);
		}

	    }
	    
	    logger.info('Ranking the best record');

	    return iterate(records);

	}

	function getMatchCandidates(record, query_list, candidates)
	{
	    
	    function getQuery()
	    {

		function getQueryStatement(query_template)
		{
		    
		    var query = '',
		    offset = 0,
		    re = new RegExp('\\${(.[^}]*)}', 'g');
		    
		    function processTemplate()
		    {
			
			var results = re.exec(query_options.query);

			if (results) {

			    query += query_template.slice(offset, results.index);
			    query += jsonpath.value(record, results[1]);
			    
			    offset = results.index + results[0].length;
			    
			    return processTemplate();
			    
			} else if (query.length > 0) {
			    return query;
			} else {
			    /**
			     * @internal No expressions in query template
			     */ 
			    return query_template;
			}		    
			
		    }

		    return processTemplate();
		    
		}

		if (typeof query_options.query === 'string') {
		    return getQueryStatement(query_options.query);
		} else {
		    return Object.assign(query_options.query, {
			term: getQueryStatement(query_options.query.term)
		    });
		}

	    }
		
	    var query_options = query_list.shift();
	    var record_copy = JSON.parse(JSON.stringify(record));

	    candidates = candidates ? candidates : [];

	    if (query_options === undefined) {
		return Promise.resolve(candidates);
	    } else {

		if (query_options.transformations) {
		    json_path_transformer.process(record, {
			transformations: query_options.transformations
		    });
		}

		log.setLevel('debug');
		log.debug(getQuery());

		return record_store.read(getQuery()).then(function(found_records) {
		    return getMatchCandidates(record, query_list, candidates.concat(found_records.filter(function(found_record) {
			
			var found_record_plain = found_record.toJsonObject();
			
			/**
			 * @internal Filter record out if test succeeds (Matching record found from previous candidates)
			 */
			return !candidates.some(function(candidate) {
			    return objectCompare(candidate.toJsonObject(), found_record_plain);
			});
			
		    })));
		});

	    }

	}

	var record_store, proto, fn_run_proto, fn_set_logger_proto, fn_rank;

	validateConfig();

	proto = protoFactory(parameters.matching);
	
	fn_run_proto = proto.run;
	fn_set_logger_proto = proto.setLogger;

	if (parameters.rank) {
	    fn_rank = rankFactory(parameters.rank);
	}

	proto.setLogger = function(logger_arg)
	{
	    logger = logger_arg;
	    fn_set_logger_proto(logger);
	};

	proto.setRecordStore = function(record_store_arg)
	{
	    record_store = record_store_arg;
	};

	proto.findMatchCandidates = function(record)
	{

	    record = isCloneOf(record, new MarcRecord()) ? record : new MarcRecord(record);

	    return getMatchCandidates(record.toJsonObject(), parameters.matchCandidatesQuery.slice());
	    
	};

	proto.run = function(record)
	{

	    logger.debug('Finding matches for input record ' + record.record.get(/^001$/)[0].value);
	    
	    return fn_run_proto(record).then(function(results) {
		return results.map(function(value, index) {
		    switch (index) {
		    case 0:
			return new MarcRecord(value);
		    case 1:

			value = value.map(function(obj) {
			    return new MarcRecord(obj);
			});

			return typeof fn_rank === 'function' ? getBestRecords(value) : value;

		    default:
			return value.reduce(function(results_additional, result, index_result) {

			    var id = new MarcRecord(results[1][index_result]).get(/^001$/)[0].value;

			    results_additional[id] = result;
			    
			    return results_additional;

			}, {});
		    }
		});

	    });
	    
	};

	return proto;

    };

}

