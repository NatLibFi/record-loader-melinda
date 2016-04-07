define(['xmlhttprequest-mock', '../record-store-melinda'], function(xhrMockFactory, runTests) {

  'use strict';

  runTests(xhrMockFactory(1));
  
});
