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
      '@natlibfi/record-loader-prototypes/lib/hooks/related-records-retrieved/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/es6-polyfills/lib/polyfills/object'),
      require('marc-record-js'),
      require('@natlibfi/record-loader-prototypes/lib/hooks/related-records-retrieved/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, MarcRecord, hookFactory)
{
  
  'use strict';

  /**
   * @param {object} parameters
   * @param {number} [treshold=0] - x
   */
  return function(parameters)
  {

    var logger, record_store,
    obj = hookFactory();

    parameters = parameters || {};

    function compareRecords(records_set, records_store)
    {

      var result;
      
      function getComponentsLength(records)
      {
        return records.filter(function(record) {
          return record.get(/^773$/).length > 0;
        }).length;
      }

      result = {
        recordSet: getComponentsLength(records_set),
        recordStore: getComponentsLength(records_store)
      };

      result.difference = Math.abs(result.recordSet - result.recordStore);
      records_set = records_set.map(function(record) {
        return {
          record: record.toJsonObject(),
          relatedRecordsRetrievedHook: JSON.parse(JSON.stringify(result))
        };
      });

      return result.recordSet === result.recordStore ||
        result.recordSet === 0 && result.recordStore > 0 ||
        result.recordSet > 0 && result.recordStore === 0 ||
      ((typeof parameters.treshold === 'number' || 0) - result.difference) >= 0 ? Promise.resolve(records_set) : Promise.reject(records_set);

    }

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
      run: function(records_data)
      {

        logger.info('Retrieving record store counterpart');

        return records_data.length === 0 ? Promise.resolve(records_data) : record_store.read({

          idList: [records_data[0].record.melindaHostId],
          fetchComponents: true

        }).then(function(records_store) {          
          logger.info('Done');
          
          function formatResults(results)
          {
            return results.map(function(record) {
              return {
                record: {
                  melindaHostId: records_data[0].record.melindaHostId,
                  record: record.record,
                  relatedRecordsRetrievedHook: record.relatedRecordsRetrievedHook
                }
              };
            });
          }

          return compareRecords(records_data.map(function(data) {
            return new MarcRecord(data.record.record);
          }), records_store).then(formatResults, function(results) {
            return formatResults(results).map(function(result) {
              return Object.assign(result, {
                failed: true
              });
            });
          });
        });
      }
    });

  };

}
