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
			'@natlibfi/es6-polyfills/lib/polyfills/promise',
			'@natlibfi/es6-polyfills/lib/polyfills/object',
			'marc-record-js',
			'merge',
			'@natlibfi/record-loader-prototypes/lib/hooks/related-records-matched/prototype'
		], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory(
			require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
			require('@natlibfi/es6-polyfills/lib/polyfills/object'),
			require('marc-record-js'),
			require('merge'),
			require('@natlibfi/record-loader-prototypes/lib/hooks/related-records-matched/prototype')
		);
	}
	
}(this, factory));

function factory(Promise, Object, MarcRecord, mergeObjects, hookFactory)
{
	
	'use strict';
	
	/**
	* @param {object} parameters
	* @param {boolean} parameters.findMissingByIndex - Attempts to find matches for records based on the index of the record id (001-field). Example: There is no match for record 124 but there are matches for records 123, 125 and their corresponding matches have ids 1500 and 1502. Therefore it is assumed that the match for record set record 124 is 1501 in the record store
	* @param {object} parameters.difference - Denotes the maximum number of extraneous components that are allowed. If the number components exceeds the value the processing is aborted
	* @param {number} parameters.difference.recordSet - Maximum number of extraneous components to allow for the record set
	* @param {number} parameters.difference.recordStore - Maximum number of extraneous components to allow for the record store
	* @param {object} parameters.onFailure - Force creating records in the record store when the check for corresponding records fail
	* @param {boolean} parameters.onFailure.updateEmptyHost - Create all components from the record set in the record store as new and set them as components of the record store host
	* @param {boolean} parameters.onFailure.createAsNew - Create all records as new in the record store
	*/
	return function(parameters)
	{
		
		var logger, record_store,
		obj = hookFactory();
		
		parameters = parameters || {};
		parameters.difference = parameters.difference || {};
		
		return Object.assign(obj, {
			setLogger: function(logger_arg)
			{
				logger = logger_arg;
				return obj;
			},
			setRecordStore: function(record_store_arg)
			{
				record_store = record_store_arg;
				return obj;
			},
			run: function(records)
			{
				return record_store.read({
					
					idList: [records[0].melindaHostId],
					fetchComponents: true
					
				}).then(function(records_store) {
					
					function normalizeMatches(records)
					{
						
						function hasFailures(records)
						{
							return records.some(function(record) {
								return record.failed;
							});
						}
						
						function mapNoop(record)
						{
							return record;
						}
						
						/**
						* Remove matched records that already are a singular match for _one_ other record
						*/
						function removeMultiMatches(record)
						{
              
              var removed_matches = [];
              
              record =  Object.assign(record, {
                matchedRecords: record.matchedRecords.length > 1 ? record.matchedRecords.filter(function(matched_record) {
                  var matched_record_marc = new MarcRecord(matched_record),
                  found_matches = records.filter(function(other_record) {
                    return other_record !== record && other_record.matchedRecords.length === 1 && new MarcRecord(other_record.matchedRecords[0]).equalsTo(matched_record_marc);
                  });
                  
                  if (found_matches.length === 1) {		
                    removed_matches.push(matched_record);
                    return false;
                  } else {
                    return true;
                  }
                }) : record.matchedRecords
              });
              
              return mergeObjects.recursive(true, record, removed_matches.length > 0 ? {
                normalization: {
                  multiMatchesRemoved: removed_matches
                }
              } : {});
              
						}
						
						function checkMultiMatches(records)
						{
							
							records = records.map(function(record) {
								return Object.assign(record, record.matchedRecords.length > 1 ? {
									failed: true,
									message: 'Multiple matches not allowed'
								} : {});
							});       
							
							return records.some(function(record) {
								return record.failed;
							}) ? Promise.reject(records) : Promise.resolve(records);
							
						}
						
						/**
						* Check if there is a single record in the set that has no matches. If it is the host, set the record store host as it's match. Otherwise set a single matchless record in the record store side as it's match
						*/
						function findMissing(record, index, records)
						{
							var record_store;
							
							if (records_store.length > 0 && record.matchedRecords.length === 0 && !records.some(function(record_other) {
								return record_other !== record && record_other.matchedRecords.length === 0;
							})) {
								record_store = records_store.filter(function(record_store) {
									return records.every(function(record_other) {
										return !record_other.matchedRecords.some(function(record_other_matching) {
											return new MarcRecord(record_store).equalsTo(new MarcRecord(record_other_matching));
										});
									});
								});
								
								if (record_store.length === 1) {
									record_store = record_store.shift();
									record.matchedRecords = record.record.record.get(/^773$/).length === 0 ? [records_store[0]] : [record_store];
									record = mergeObjects(true, record, {
										normalization: {
											foundMissing: true
										}
									});
								}
							}
							
							return record; 
						}
						
						/**
						* Attempt to find a match for a record based on it's index and the indexes of the surrounding records in correspondence to the record store indexes
						*/
						function findMissingByIndex(record, index, records)
						{
							
							function getSurroundingRecords()
							{
								return records.filter(function(record_other) {
									var id_other = Number(new MarcRecord(record_other.record.record).get(/^001$/).shift().value);
                  if (record_other.matchedRecords.length === 1) {
                    console.log(id+':'+(id_other === (id + 1) || id_other === (id - 1))+':'+(id+1)+':'+(id-1));
                  }
									return record_other.matchedRecords.length === 1 && (id_other === (id + 1) || id_other === (id - 1));
								});
							}
							
							function findMatch(surrounding_records)
							{
								
								function getMatchingRecord(id)
								{
									return records_store.filter(function(record_store) {		
										var record_store_stringified = JSON.stringify(record_store.toJsonObject());
										return Number(record_store.get(/^001$/).shift().value) === id && !records.some(function(record) {
											return record.matchedRecords.length === 1 && JSON.stringify(record.matchedRecords[0]) === record_store_stringified;
										});
									}).slice(0, 1);
								}
								
								var record_store_ids = surrounding_records.map(function(record) {
									return Number(new MarcRecord(record.matchedRecords[0]).get(/^001$/).shift().value);
								});

						    if (surrounding_records.length === 1) {
									return getMatchingRecord(Number(surrounding_records[0].record.record.get(/^001$/).shift().value) < id ? record_store_ids[0] + 1 : record_store_ids[0] - 1);
								} else if (surrounding_records.length > 1) {
									return record_store_ids[1] - record_store_ids[0] === 2 ? getMatchingRecord(record_store_ids[0] + 1) : [];
								} else {
									return [];
								}
							}
							
							var id;
							
							if (record.matchedRecords.length === 0) {
								id = Number(new MarcRecord(record.record.record).get(/^001$/).shift().value);
								record = Object.assign(record, {
									matchedRecords: findMatch(getSurroundingRecords())
								});

								return mergeObjects.recursive(true, record, record.matchedRecords.length === 1 ? {
									normalization: {
										foundMissingByIndex: true
									}
								} : {});
							} else {
								return record;
							}
							
						}
						
						function checkMatchless(records)
						{

							records = records.map(function(record) {
								return Object.assign(record, record.matchedRecords.length === 0 ? {
									failed: true,
									message: 'Records without matches not allowed'
								} : {});
							});
							
							return hasFailures(records) ? Promise.reject(records) : Promise.resolve(records);
							
						}
												
						function checkUniqueMatches(records)
						{
							records = records.map(function(record) {
                var matched_record = new MarcRecord(record.matchedRecords[0]);
                
							  return records.filter(function(record2) {
                  return !record2.record.record.equalsTo(record.record.record);
                }).some(function(record2) {
                  return matched_record.equalsTo(new MarcRecord(record2.matchedRecords[0]));
                }) ? Object.assign(record, {
                  failed: true,
                  message: 'Only unique matches are allowed'
                }) : record;
							});
							
							return hasFailures(records) ? Promise.reject(records) : Promise.resolve(records);
						}

						return checkMultiMatches(records.map(removeMultiMatches)).then(function(records) {
							return checkMatchless(records.map(findMissing).map(parameters.findMissingByIndex ? findMissingByIndex : mapNoop));
						}).then(checkUniqueMatches);
						
					}
					
					function checkDifference(records)
					{
						
						var result = {},
						difference = records.length - records_store.length;

// Should't occur because only single unique matches are allowed
						/*if (Number.isInteger(parameters.difference.recordSet) && difference > 0 && difference > parameters.difference.recordSet) {
							result = {
								failed: true,
								message: 'Too many extraneous input records in the host-component set'                
							};
            
            } else */if (Number.isInteger(parameters.difference.recordStore) && difference < 0 && Math.abs(difference) > parameters.difference.recordStore) {
							result = {
								failed: true,
								message: 'Too many extraneous record store records in the host-component set'
							};
						}
						
						records = records.map(function(record) {
							return Object.assign(record, result);
						});
						
						return result.failed ? Promise.reject(records) : Promise.resolve(records);
						
					}
					
					try {
						return normalizeMatches(records)
						.then(checkDifference)
						.catch(function(records) {
							return Promise.reject(records);
						});
					} catch (error) {
            /* istanbul ignore next: Cannot really be tested */
						return Promise.reject(error);
					}
					
				});                                                            
			}
		});
		
	};
	
}
