/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related modules for recordLoader
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

(function(root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'chai/chai',
      'chai-as-promised',
      'es6-polyfills/lib/polyfills/promise',
      '../lib/record-store/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('../lib/record-store/melinda')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, Promise, recordStoreFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);

  describe('record-store', function() {

    describe('factory', function() {

      it('Should create the expected object', function() {
        expect(recordStoreFactory()).to.be.an('object')
          .and.to.respondTo('setLogger')
          .and.to.respondTo('rollback')
          .and.to.respondTo('create')
          .and.to.respondTo('read')
          .and.to.respondTo('update')
          .and.to.respondTo('delete');
      });

      describe('object', function() {

        var record_store = recordStoreFactory();       

        describe('#setLogger', function() {

          it('Should return itself', function() {
            expect(record_store.setLogger()).to.eql(record_store);
          });

        });

        describe('#rollback', function() {

          it('Should return a Promise and resolve with undefined', function() {
            return record_store.rollback().then(function(result) {
              expect(result).to.be.undefined /* jshint -W030 */;
            });
          });

          it('Should roll back the changes done by #create', function(){});
          
        });

        describe('#create', function() {

          it('Should return a Promise which resolves with an object', function() {
            return record_store.create().then(function(result) {
              expect(result).to.be.an('object');
            });
          });

          it('Should create a new record in the store', function(){});
          
        });

        describe('#read', function() {

          it('Should return a Promise which resolves with an array', function() {
            return record_store.read().then(function(result) {
              expect(result).to.be.an('array');
            });
          });

          it('Should read records from the store', function(){});
          
        });

        describe('#update', function() {

          it('Should return a Promise which resolves with an array', function() {
            return record_store.update().then(function(result) {
              expect(result).to.be.an('array');
            });
          });

          it('Should update records in the store', function(){});
          
        });

        describe('#delete', function() {

          it('Should return a Promise which resolves with an array', function() {
            return record_store.delete().then(function(result) {
              expect(result).to.be.an('array');
            });
          });

          it('Should delete records from the store', function(){});
          
        });

      });

    });

  });

}
