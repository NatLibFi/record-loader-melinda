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
      'es6-polyfills/lib/polyfills/promise',
      '../lib/result-formatter/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('../lib/result-formatter/melinda')
    );
  }

}(this, factory));

function factory(chai, Promise, resultFormatterFactory)
{

  'use strict';

  var expect = chai.expect;

  describe('result-formatter', function() {

    describe('factory', function() {

      it('Should create the expected object', function() {
        expect(resultFormatterFactory()).to.be.an('object')
          .and.to.respondTo('setLevel')
          .and.to.respondTo('setLogger')
          .and.to.respondTo('run');
      });

      describe('#getLevels', function() {

        it('Should return the expected object which is immutable', function() {
          expect(resultFormatterFactory.getLevels()).to.have.all.keys(['statistics', 'recordMetaData', 'recordData']).and.to.be.frozen.and.to.be.sealed /* jshint -W030 */;
        });

      });
      
      describe('object', function() {

        var result_formatter = resultFormatterFactory();

        describe('#setLogger', function() {

          it('Should return itself', function() {
            expect(result_formatter.setLogger()).to.eql(result_formatter);
          });

        });

        describe('#setLevel', function() {

          it('Should return itself', function() {
            expect(result_formatter.setLevel()).to.eql(result_formatter);
          });

        });

        describe('#run', function() {

          it('Should return a Promise', function() {
            expect(result_formatter.run()).to.be.an.instanceof(Promise);
          });
          
        });

      });

    });

  });

}
