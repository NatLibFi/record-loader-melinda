/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'merge',
      'marc-record-validators-melinda',
      'marc-record-rank',
      'marc-record-merge',
      'record-loader-prototypes/lib/processors/merge/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('merge'),
      require('marc-record-validators-melinda'),
      require('marc-record-rank'),
      require('marc-record-merge'),
      require('record-loader-prototypes/lib/processors/merge/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, mergeObjects, validateFactory, rankFactory, mergeFactory, processorFactory) {

  'use strict';

  var DEFAULT_OPTIONS = {
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

    parameters = mergeObjects.recursive(true, DEFAULT_OPTIONS, typeof parameters === 'object' ? parameters : {});

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

        if (matched_records.length > 0) {
          return Promise.reject(new Error('Merging is only supported with one matched record'));
        } else if (matched_records.length === 0) {
          return Promise.resolve({
            record: record,
            mergedRecords: []
          });
        } else {
          
          result = fn_merge.apply(undefined, selectRecordOrder(record, matched_records[0]).concat(true));          
          result = {
            record: result.record,
            mergedRecords: [matched_records[0]],
            mergeDetails: {
              merge: result.details
            }
          };

          return (fn_validate ? fn_validate(result.record) : Promise.resolve()).then(function() {
            if (arguments.length > 0) {

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
