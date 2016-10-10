/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/object',
      'es6-polyfills/lib/polyfills/promise',
      'record-loader-prototypes/lib/result-formatter/prototype',
      '../../result-formatter/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('record-loader-prototypes/lib/result-formatter/prototype'),
      require('../../result-formatter/melinda')
    );
  }

}(this, factory));

function factory(Object, Promise, resultFormatterPrototypeFactory, resultFormatterFactory)
{
  
  'use strict';

  var RESULT_LEVELS = resultFormatterPrototypeFactory.getLevels();
  
  return function(parameters)
  {

    var level,
    obj = resultFormatterFactory(parameters),
    fn_proto_set_level = obj.setLevel,
    fn_proto_run = obj.run;
    
    return Object.assign(obj, {
      setLevel: function(level_arg)
      {
        level = level_arg;
        return fn_proto_set_level(level);
      },
      /**
       * Passes only the actual record data to the prototype function but doesn't convert it back because we don't need the hostcomp represenation anymore at this point
       */
      run: function(results)
      {
        return fn_proto_run(level & RESULT_LEVELS.recordData ? Object.assign(results, {
          records: results.records.map(function(result) {
            
            return Object.assign(result, result.hasOwnProperty('record') ? {
              record: result.record.record
            } : {});
            
          })
        }) : results);
      }
    });
    
  };

}
