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
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'marc-record-validators-melinda',
      'marc-record-js',
      'marc-record-rank',
      'marc-record-merge',
      'record-loader-prototypes/lib/processors/merge/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('marc-record-validators-melinda'),
      require('marc-record-js'),
      require('marc-record-rank'),
      require('marc-record-merge'),
      require('record-loader-prototypes/lib/processors/merge/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, validateFactory, MarcRecord, rankFactory, mergeFactory, processorFactory) {

  'use strict';

  var DEFAULT_OPTIONS = {
    merge: {
      fields: []
    },
    rank: {
      preferRecordStore: true
    }
  };

  /**
   * @param {object} [rank] - x
   * @param {boolean} rank.preferRecordStore - x
   * @param {boolean} rank.preferRecordSet - x
   * @param {object} merge - x
   * @param {object} [validate] - x
   */
  return function(parameters) {

    var logger, fn_rank, fn_merge, fn_validate,
    obj = processorFactory();

    parameters = Object.assign(JSON.parse(JSON.stringify(DEFAULT_OPTIONS)), typeof parameters === 'object' ? parameters : {});
    fn_rank = parameters.rank && !parameters.rank.hasOwnProperty('preferRecordStore') && !parameters.rank.hasOwnProperty('preferRecordSet') ? rankFactory(parameters.rank) : undefined;
    fn_merge = mergeFactory(parameters.merge);
    fn_validate = parameters.validate ? validateFactory(parameters.validate) : undefined;

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      run: function(record, matched_records)
      {

        var result;

        function selectRecordOrder(set_record, store_record)
        {
          if (fn_rank) {
            return fn_rank(set_record, store_record) >= 0 ? [set_record, store_record] : [store_record, set_record];
          } else {
            return parameters.rank.preferRecordStore ? [store_record, set_record] : [set_record, store_record];
          }
        }

        if (matched_records.length > 1) {
          return Promise.reject(new Error('Merging is only supported with one matched record'));
        } else if (matched_records.length === 0) {
          return Promise.resolve({
            record: record,
            mergedRecords: []
          });
        } else {
          
          result = fn_merge.apply(undefined, selectRecordOrder(new MarcRecord(record), new MarcRecord(matched_records[0])).concat(true));          
          result = {
            record: result.record,
            mergedRecords: [matched_records[0]],
            mergeDetails: {
              merge: result.details
            }
          };

          return (fn_validate ? fn_validate(result.record) : Promise.resolve()).then(function() {
            if (arguments[0] !== undefined) {

              Object.assign(result, {
                mergeDetails: Object.assign(result.mergeDetails, {
                  validate: arguments[0]
                })
              });

              return result.mergeDetails.validate.failed ? Promise.reject(result) : result;

            } else {
              return result;
            }
          });
          
        }
      }
    });

  };

}
