/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related modules for recordLoader
 *
 * Copyright (c) 2015-2017 University Of Helsinki (The National Library Of Finland)
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
      '../lib/hostcomp/record-set/hostcomp'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('../lib/hostcomp/record-set/hostcomp')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, Promise, recordSetFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);

  describe('record-set', function() {

    describe('factory', function() {

      it('Should create the expected object', function() {
        expect(recordSetFactory()).to.be.an('object')
          .and.to.respondTo('setLogger')
          .and.to.respondTo('initialize')
          .and.to.respondTo('get');
      });

      describe('object', function() {

        var record_set = recordSetFactory();

        describe('#setLogger', function() {

          it('Should return itself', function() {
            expect(record_set.setLogger()).to.eql(record_set);
          });

        });

        describe('#initialize', function() {

          it('Should return a Promise', function() {
            expect(record_set.initialize()).to.be.an.instanceof(Promise);
          });
          
        });

        describe('#get', function() {

          it('Should return a Promise which resolves with an array', function() {
            return record_set.get().then(function(result) {
              expect(result).to.be.an('array');
            });
          });
          
        });

      });

    });

  });

}
