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
      '@natlibfi/record-loader-prototypes/lib/logger/prototype',
      '../lib/processors/preprocess/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/record-loader-prototypes/lib/logger/prototype'),
      require('../lib/processors/preprocess/melinda')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, Promise, loggerFactory, processorFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);
  
  describe('processors', function() {

    describe('preprocess', function() {

      function createProcessor(parameters)
      {
        return processorFactory(parameters || {
          validators: [{
            name: 'sort-tag',
            options: '500'
          }]
        });
      }
      
      describe('factory', function() {

        it('Should create the expected object', function() {
          expect(createProcessor()).to.be.an('object')
            .and.to.respondTo('setLogger')
            .and.to.respondTo('run');
        });
        
        describe('object', function() {

          describe('#setLogger', function() {

            it('Should return itself', function() {

              var processor = createProcessor();
              
              expect(processor.setLogger()).to.eql(processor);

            });

          });

          describe('#run', function() {

            var processor = createProcessor().setLogger(loggerFactory().createInstance('foobar'));

            it('Should return a Promise which resolves with an object', function() {

              var record = {
                leader: undefined,
                fields: [
                  {
                    tag: '500',
                    subfields: [{
                      code: 'a',
                      value: 'foo'
                    }]
                  },
                  {
                    tag: '500',
                    subfields: [{
                      code: 'a',
                      value: 'bar'
                    }]
                  },
                  {
                    tag: '700',
                    subfields: [{
                      code: 'a',
                      value: 'foobar'
                    }]
                  }
                ]
              };

              return createProcessor({}).setLogger(loggerFactory().createInstance('foobar')).run(record).then(function(result) {
                expect(result).to.be.an('object').and.to.contain.all.keys(['record']) /* jshint -W030 */;
                expect(result.record).to.eql(record);
              });

            });

            it('Should modify the record', function() {

              var record = {
                leader: undefined,
                fields: [
                  {
                    tag: '500',
                    subfields: [{
                      code: 'a',
                      value: 'foo'
                    }]
                  },           
                  {
                    tag: '700',
                    subfields: [{
                      code: 'a',
                      value: 'foobar'
                    }]
                  },
                  {
                    tag: '500',
                    subfields: [{
                      code: 'a',
                      value: 'bar'
                    }]
                  }
                ]
              };

              return processor.run(record).then(function(result) {

                expect(result).to.be.an('object').and.to.contain.all.keys(['record', 'preprocessDetails']) /* jshint -W030 */;
                expect(result.record).to.eql(Object.assign(record, {
                  fields: [record.fields[1], record.fields[2],record.fields[0]]
                }));
                expect(result.preprocessDetails).to.eql({
                  failed: false,
                  validators: [{

                    name: 'sort-tag',
                    validate: [{
                      field: {
                        tag: '500',
                        subfields: [{
                          code: 'a',
                          value: 'foo'
                        }]
                      },
                      message: 'Field is not in correct position',
                      type: 'warning'

                    }],
                    fix: [{
                      
                      field: {
                        tag: '500',
                        subfields: [{
                          code: 'a',
                          value: 'foo'
                        }]
                      },
                      new: 2,
                      old: 0,
                      type: 'moveField'
                      
                    }]
                  }]                 
                });
                
              });
            
            });

            /**
             * @todo Only legal-term validator can be made to throw errors easily?
             */
            it.skip('Should reject because of errors');
            
          });

        });

      });

    });

  });

}
