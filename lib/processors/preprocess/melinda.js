/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'marc-record-js',
      'marc-record-validators-melinda',
      'record-loader-prototypes/lib/processors/preprocess/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
	    require('marc-record-js'),
	    require('marc-record-validators-melinda'),
      require('record-loader-prototypes/lib/processors/preprocess/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, MarcRecord, validateFactory, processorFactory) {

  'use strict';

  return function(parameters) {

    var logger,
    fn_validate = validateFactory(Object.assign(typeof parameters === 'object' ? parameters : {}, {
      fix: true,
      failOnError: true
    })),
    obj = processorFactory();

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      run: function(record)
      {
        
        logger.info('Validating and fixing the record');
        
        record = new MarcRecord(record);

        return fn_validate(record).then(function(results) {

          logger.debug('Fix results: ' + JSON.stringify(results, undefined, 4));
          
          return result.failed ? Promise.reject(results) : {
            record: record.toJsonObject(),
            preprocessDetails: results
          };

        });

      }
    });
 
  };

}
