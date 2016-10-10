/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'json-similarity',
      'marc-record-rank/lib/rank',
      'marc-record-js',
      'record-loader-prototypes/lib/processors/match/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('json-similarity'),
      require('marc-record-rank/lib/rank'),
      require('marc-record-js'),
      require('record-loader-prototypes/lib/processors/match/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, jsonSimilarity, rankFactory, MarcRecord, processorFactory) {

  'use strict';

  return function(parameters)
  {

    var logger, fn_read_record_store,
    fn_rank = parameters.rank ? rankFactory(parameters.rank) : undefined,
    obj = processorFactory();

    function findBestMatch(result, record)
    {

      var rank_result, better, worse;

      if (result.length === 0) {
        return [record];
      } else {

        rank_result = fn_rank(result[0], record);
        better = rank_result >= 0 ? result[0] : record;
        worse = rank_result < 0 ? result[0] : record;

        logger.debug('Record ' + better.get(/^001$/).shift().value + ' ranks better thank ' + worser.get(/^001$/).shift().value);
        
        return [better];

      }

    }

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      setReadRecordStore: function(fn_read_record_store_arg)
      {
        fn_read_record_store = fn_read_record_store_arg;
        return obj;
      },
      run: function(record)
      {

        record = new MarcRecord(record);

        return obj.findMatchCandidates(record).then(function(found_records) {

          var results = {
            matchDetails: []
          };
          
          logger.debug('Found ' + found_records.length + ' match candidates for record ' + record.get(/^001$/).shift().value);

          results.matchedRecords = found_records
            .filter(function(found_record) {
              
              var result = jsonSimilarity(record.toJsonObject(), found_record.toJsonObject(), parameters.match);
              results.matchDetails.push(result);
              return result.match;
              
            })
            .reduce(fn_rank ? findBestMatch : function(product, record) {
              return product.concat(record);
            }, []);

          logger.debug('Match details: ' + JSON.stringify(results.matchDetails, undefined, 4));

          return results;
        
        });

      },
      findMatchCandidates: function(record)
      {
        return Promise.resolve([]);
      },
    });

  };

}
