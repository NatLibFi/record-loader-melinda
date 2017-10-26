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
      '@natlibfi/es6-polyfills/lib/polyfills/promise',
      '@natlibfi/record-loader-prototypes/lib/logger/protype',
      '../../lib/hostcomp/processors/filter/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/record-loader-prototypes/lib/logger/prototype'),
      require('../../lib/hostcomp/processors/filter/melinda')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, Promise, loggerFactory, processorFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);
  
  describe('processors', function() {

    describe('hostcomp-filter', function() {

      describe('factory', function() {

        it('Should create the expected object', function() {
          expect(processorFactory()).to.be.an('object')
            .and.to.respondTo('setLogger')
            .and.to.respondTo('run');
        });

        describe('object', function() {

          describe('#setLogger', function() {
            it('Should return itself', function() {
              var processor = processorFactory();
              expect(processor.setLogger()).to.eql(processor);
            });

          });

          describe('#run', function() {
            var processor = processorFactory().setLogger(loggerFactory().createInstance('foobar'));

            it('Should return a Promise which resolves with a boolean', function() {

              return processor.run({
                melindaHostId: 'foo',
                record: {
                  fields: [
                    {
                      tag: '005',
                      value: 'foo'
                    },
                    {
                      tag: '245',
                      subfields: [{
                        code: 'a',
                        value: 'bar'
                      }]
                    }
                  ]
                }
              }).then(function(result) {

                expect(result).to.be.an('object').and.to.eql({
                  passes: false,
                  filterDetails: 'The record is missing 001-field'
                });
                
                return processor.run({
                  melindaHostId: 'foo',
                  record: {
                    fields: [
                      {
                        tag: '001',
                        value: 'foo'
                      },
                      {
                        tag: '245',
                        subfields: [{
                          code: 'a',
                          value: 'bar'
                        }]
                      }
                    ]
                  }
                }).then(function(result) {
                  
                  expect(result).to.be.an('object').and.to.eql({
                    passes: true
                  });
                  
                });
                
              });              
            });
            
          });

        });

      });

    });

  });

}
