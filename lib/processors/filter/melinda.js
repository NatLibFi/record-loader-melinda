/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'record-loader-prototypes/lib/processors/filter/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('record-loader-prototypes/lib/processors/filter/prototype')
    );
  }

}(this, factory));

function factory(Promise, Object, processorFactory) {

  'use strict';

  return function() {

    var logger,
    obj = processorFactory();

    return Object.assign(obj, {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      run: function(record)
      {
        return Promise.resolve({
          passes: record.fields.some(function(field) {
            return field.tag === '001';
          })
        });
      }
    });

  };

}
