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
      'marc-record-js',
      '@natlibfi/es6-polyfills/lib/polyfills/promise',
      '../../lib/hostcomp/processors/match/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('marc-record-js'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('../../lib/hostcomp/processors/match/melinda')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, MarcRecord, Promise, processorFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);
  
  describe('processors', function() {

    describe('hostcomp-match', function() {

      describe('factory', function() {

        it('Should create the expected object', function() {
          expect(processorFactory()).to.be.an('object')
            .and.to.respondTo('setLogger')
            .and.to.respondTo('setReadRecordStore')
            .and.to.respondTo('run');
        });

        describe('object', function() {

          var processor = processorFactory();

          describe('#setLogger', function() {

            it('Should return itself', function() {
              expect(processor.setLogger()).to.eql(processor);
            });

          });

          describe('#setReadRecordStore', function() {

            it('Should return itself', function() {
              expect(processor.setReadRecordStore()).to.eql(processor);
            });

          });

          describe('#run', function() {
            
            var processor2 = processorFactory()
              .setLogger({
                info: function() {},
                debug: function() {},
                error: function() {},
                warning: function() {}
              })
              .setReadRecordStore(function() {
                return Promise.resolve([]);
              });
            
            it('Should return a Promise which resolves with the expected object', function() {
              
              return processor2.run({
                record: new MarcRecord({
                  fields: [{
                    tag: '001',
                    value: 'foo'
                  }]
                })
              }).then(function(result) {
                expect(result).to.be.an('object');
                expect(result).to.eql({
                  matchedRecords: [],
                  matchDetails: []
                });
              });
            });
            
          });

        });

      });

    });

  });

}
