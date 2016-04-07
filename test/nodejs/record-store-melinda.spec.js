(function() {

  'use strict';

  var nock = require('nock'),
  Object = require('es6-polyfills/lib/polyfills/object'),
  DEFAULT_OPTIONS = {
    status: 200,
    body: '',
    headers: {}
  };

  require('../record-store-melinda')({
    create: function(options)
    {
      
      options = Object.assign(JSON.parse(JSON.stringify(DEFAULT_OPTIONS)), typeof options === 'object' ? options : {});

      if (typeof options.url !== 'string') {
        throw new Error('URL is not defined or not a string');
      } else {
        nock(options.url).get().reply(options.status, options.body, options.headers);
      }

    },
    restore: function() 
    {
      nock.cleanAll();
    }
  });

}());
