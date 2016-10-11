/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/object',
      '../../../processors/merge/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('../../../processors/merge/melinda')
    );
  }

}(this, factory));

function factory(Object, processorFactory)
{

  'use strict';

  return function(parameters) {
    
    var obj = processorFactory(parameters),
    fn_proto_run = obj.run;

    return Object.assign(obj, {
      run: function(record, matchedRecords)
      {
        return fn_proto_run(record.record, matchedRecords).then(function(result) {
          return Object.assign(result, {
            record: Object.assign(record, {
              record: result.record
            })
          });
        });
      }
    });
    
  };

}
