/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/object',
      '../../../processors/match/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/object'),
      require('../../../processors/match/melinda')
    );
  }

}(this, factory));

function factory(Object, processorFactory) {

  'use strict';

  return function(parameters)
  {

    var fn_read_record_store, host_id,
    obj = processorFactory(parameters),
    fn_proto_set_read_record_store = obj.setReadRecordStore,
    fn_proto_run = obj.run;

    return Object.assign(obj, {
      findMatchCandidates: function(record)
      {
        return fn_read_record_store({
          idList: [host_id],
          fetchComponents: true
        });
      },
      setReadRecordStore: function(fn_read_record_store_arg)
      {
        fn_read_record_store = fn_read_record_store_arg;
        fn_proto_set_read_record_store(fn_read_record_store_arg);
        return obj;
      },
      run: function(record)
      {

        host_id = record.melindaHostId;

        return fn_proto_run(record.record).then(function(r) {
          return new Promise(function(cb) {
            setTimeout(function() {
              cb(r);
            }, Math.floor(Math.random() * (3 - 1 + 1))*1000);
          });
        });

      }
    });

  };

}
