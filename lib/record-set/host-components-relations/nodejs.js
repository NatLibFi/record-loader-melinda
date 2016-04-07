/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2015-2016 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of record-loader-melinda
 *
 * record-loader-melinda is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *  
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['es6-polyfills/lib/polyfills/promise', 'fs', 'stream', './base'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('es6-polyfills/lib/polyfills/promise'), require('fs'), require('stream'), require('./base'));
  }

}(this, factory));

function factory(Promise, fs, stream, createRecordSetFactory) {

  'use strict';
  
  return createRecordSetFactory(function(source) {
    return new Promise(function(resolve, reject) {

      var str = '';

      if (typeof source === 'string') {
        source = fs.createReadStream(source);
      }

      if (source instanceof stream.Readable || source instanceof stream.Duplex) {

        source
          .on('data', function(data) {
            str += data;
          })
          .on('error', function(error) {
            reject(error);
          })
          .on('end', function() {
            resolve(str);
          });

      } else {
        reject(new Error('Unsupported source'));
      }
      
    });
  });

}
