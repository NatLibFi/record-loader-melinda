#!/usr/bin/env node
var runLoader, options, bundle_filenames;
var path = require('path');
var fs = require('fs');

if (process.argv.length < 6) {
  console.error('USAGE: run-host-components-merge SCRIPT_FILE OPTIONS_FILE SELECTED_BUNDLE_OUTPUT_FILENAME BUNDLE1 [BUNDLE2...BUNDLEn]');
  console.error('Options:');
  console.error('\tSCRIPT_FILE                 - Path to the module that creates the record loader function');
  console.error('\tOPTIONS_FILE                - Path to the JSON options file');
  console.error('\tBUNDLE_OUTPUT_FILENAME      - Path of the file to which the selected bundle\'s converted records will be written to (If matches are found)');
  console.error('\tBUNDLE1 [BUNDLE2...BUNDLEn] - Paths to the bundle files that are to be processed');
  process.exit(-1);
} else {
  runLoader = require(path.resolve(process.argv[2]));
  options = JSON.parse(fs.readFileSync(process.argv[3], { encoding: 'utf8' }));
  output_filename = process.argv[4];
  bundle_filenames = process.argv.slice(5);

  bundle_filenames.forEach(function(filename) {
    try {
      fs.accessSync(filename, fs.R_OK);
    } catch (err) {
      throw new Error('File '+filename+' is not readable');
    }
  });
  
  processBundles(bundle_filenames);
}

function processBundles(filenames, result) {
  var data;
  var filename = filenames.shift();

  if (filename) {
    result = result || {};
    data = JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' }));
  
    return runLoader(data, options).then(function(bundle_result) {
      result[filename] = bundle_result;
      return processBundles(filenames, result);        
    }, function(error) {
      console.error('Processing file ' + filename + ' failed:');
      console.error(error.hasOwnProperty('stack') ? error.stack : error);
      process.exit(-1);
    });
  } else {
    try {
      result = normalizeResults(result);

      if (result.records) {
        fs.writeFileSync(output_filename, result.records);
      };
    
      console.log(JSON.stringify(result, undefined, 2));
    } catch (err) {
      console.error(err);
      process.exit(-1);
    }
  }
  
  function normalizeResults(original_results) {
    var normalized_results = {
      matched: false,
      matchingBundles: [],
      bundleResults: clone(original_results),
      summary: {}
    };
    
    Object.keys(original_results).forEach(function(bundle_filename) {
      var bundle_results = original_results[bundle_filename];
      
      if (bundle_results.status === 'ok' && bundle_results.statistics.processed === bundle_results.statistics.succeeded) {
        normalized_results.matched = true;
        normalized_results.matchingBundles.push(bundle_filename);
        
        if (!normalized_results.selectedBundle) {
          normalized_results.selectedBundle = bundle_filename;
          normalized_results.records = bundle_results.records.reduce(function(product, item) {
            return product += item.record;
          }, '');
        }
      } else {
        normalized_results.summary[bundle_filename] = bundle_results.records.reduce(function(product, record_results) {
          if (record_results.failed) {
            var key = getErrorKey(record_results.message);
            
            if (key === 'tooManyRecordsInRecordStoreSet') {
              product[key] = true;
            } else {
              product[key] = Number.isInteger(product[key]) ? product[key] + 1 : 1;
            }
          }
          return product;
        }, {});
      }
    });
    
    return normalized_results;
    
    function getErrorKey(message) {
      switch (message) {
        case 'Multiple matches not allowed':
          return 'multipleMatches';
        case 'Records without matches not allowed':
          return 'noMatches';
        case 'Only unique matches are allowed':
          return 'nonUniqueMatches';
        case 'Too many extraneous record store records in the host-component set':
          return 'tooManyRecordsInRecordStoreSet';
        default:
          console.error('*** run-host-components-merge ***: Unknown error message: '+message);
          return 'unknownError';
      }
    }
  }
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
