/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'marc-record-js',
      'record-loader-prototypes/lib/hooks/related-records-retrieved/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('marc-record-js'),
      require('record-loader-prototypes/lib/hooks/related-records-retrieved/prototype')
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

        return Object.assign(record, {
          record: record.toJsonObject(),
          relatedRecordsRetrievedHook: JSON.parse(JSON.stringify(result))
        });

      });

      return result.recordSet.length === result.recordStore.length ||
        result.recordSet.length === 0 && result.recordStore.length > 0 ||
        result.recordSet.length > 0 && result.recordStore.length === 0 ||
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
                  record: record
                }
              };
            });
          }

          return compareRecords(records_data.map(function(data) {

            return new MarcRecord(data.record.record);

          }), records_store).then(formatResults, formatResults);
          
        });
      }
    });

  };

}
