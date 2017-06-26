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
      '../../lib/hostcomp/hooks/related-records-retrieved/hostcomp'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('../../lib/hostcomp/hooks/related-records-retrieved/hostcomp')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, Promise, hookFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);
  
  describe('hooks', function() {

    describe('related-records-retrieved', function() {

      describe('factory', function() {

        it('Should create the expected object', function() {
          expect(hookFactory()).to.be.an('object')
            .and.to.respondTo('setLogger')
            .and.to.respondTo('setRecordStore')
            .and.to.respondTo('run');
        });

        describe('object', function() {

          var hook = hookFactory();

          describe('#setLogger', function() {

            it('Should return itself', function() {
              expect(hook.setLogger()).to.eql(hook);
            });

          });

          describe('#setRecordStore', function() {

            it('Should return itself', function() {
              expect(hook.setRecordStore()).to.eql(hook);
            });

          });

          describe('#run', function() {

            it('Should return a Promise which resolves with an array', function() {

              return hook.run([]).then(function(result) {
                expect(result).to.be.an('array');
              });

            });
            
          });

        });

      });

    });

  });

}
