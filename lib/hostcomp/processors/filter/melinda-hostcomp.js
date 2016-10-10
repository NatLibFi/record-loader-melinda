/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/object',
      '../../../processors/filter/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('../../../processors/filter/melinda')
    );
  }

}(this, factory));

function factory(Object, processorFactory) {

  'use strict';

  return function() {
    
    var obj = processorFactory(),
    fn_proto_run = obj.run;

    return Object.assign(obj, {   
      run: function(record)
      {
        return fn_proto_run(record.record);
      }
    });

  };

}
