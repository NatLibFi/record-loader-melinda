/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/object',
      'marc-record-converters',
      'record-loader-prototypes/lib/record-set/prototype'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('marc-record-converters'),
      require('record-loader-prototypes/lib/record-set/prototype')
    );
  }

}(this, factory));

function factory(Object, marc_record_converters, recordSetFactory)
{
  
  'use strict';

//Set the format in parameters instead of data
  return function(parameters)
  {

    var logger, bundle, sent,
    obj = {};
    
    return Object.assign(obj, recordSetFactory(), {
      setLogger: function(logger_arg)
      {
        logger = logger_arg;
        return obj;
      },
      initialize: function(bundle_arg)
      {

        function initializeBundle()
        {

          function convertRecords(str, format)
          {
            return marc_record_converters.hasOwnProperty(format) ? (function() {

              bundle.records = marc_record_converters[format].convertFrom(str).map(function(record) {
                return record.toJsonObject();
              });

              return Promise.resolve();
              
            })() : Promise.reject(new Error('Unsupported format: ' + format));
          }

          bundle = Object.assign({}, bundle_arg);
          return Array.isArray(bundle_arg.records) ? Promise.resolve() : convertRecords(bundle.records, bundle.format);

        }

        return typeof bundle_arg === 'object' && typeof bundle_arg.melindaHostId === 'string' && (typeof bundle_arg.records === 'string' || Array.isArray(bundle_arg.records)) ?
          initializeBundle() : Promise.reject(new Error('Invalid bundle'));

      },
      get: function()
      {
        return Promise.resolve(sent ? undefined : function() {
          
          sent = 1;

          return bundle.records.map(function(record) {
            return {
              melindaHostId: bundle.melindaHostId,
              record: record
            };
          });

        }());
      }
    });

  };

}
