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
      '../../lib/hostcomp/record-set/hostcomp'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('../../lib/hostcomp/record-set/hostcomp')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, Promise, recordSetFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);

  describe('hostcomp-record-set', function() {

    describe('factory', function() {

      it('Should create the expected object', function() {
        expect(recordSetFactory()).to.be.an('object')
          .and.to.respondTo('setLogger')
          .and.to.respondTo('initialize')
          .and.to.respondTo('get');
      });

      describe('object', function() {

        describe('#setLogger', function() {
          it('Should return itself', function() {
            var record_set = recordSetFactory();
            expect(record_set.setLogger()).to.eql(record_set);
          });
        });

        describe('#initialize', function() {

          it('Should return a Promise', function() {
            expect(recordSetFactory().initialize()).to.be.an.instanceof(Promise);
          });
          
          it('Should reject because the bundle is invalid', function() {
            return recordSetFactory().initialize().catch(function(error) {
              expect(error).to.be.an('error');
              expect(error.message).to.equal('Invalid bundle');
            });
          });
          
          it('Should reject because the bundle record format is unsupported', function() {
            return recordSetFactory().initialize({
              melindaHostId: 'foo',
              records: 'foo',
              format: 'bar'
            }).catch(function(error) {
              expect(error).to.be.an('error');
              expect(error.message).to.equal('Unsupported format: bar');
            });
          });
          
          it('Should initialize the bundle using the record data as-is', function() {
            return recordSetFactory().initialize({
              melindaHostId: 'foo',
              records: []
            }).then(function(result) {
              expect(result).to.be.an('undefined');
            });
          });
          
          it('Should initialize the bundle and convert the record data', function() {
            return recordSetFactory().initialize({
              melindaHostId: 'foo',
              format: 'marc21slimXML',
              records: '<?xml version="1.0" encoding="UTF-8"?><collection firstRecordNumber="1" allRecordsCount="2"><record><leader>00000cam^a22000004i^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record><record><leader>00000caa^a22000004i^4500</leader><controlfield tag="001">000006001</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">bar</subfield></datafield><datafield tag="773" ind1="0" ind2=" "><subfield code="w">(FI-MELINDA)000006000</subfield></datafield></record></collection>'
            }).then(function(result) {
              expect(result).to.be.an('undefined');
            });
          });
          
        });

        describe('#get', function() {

          it('Should return a Promise which resolves with an array', function() {
            var record_set = recordSetFactory();

            return record_set.initialize({
              melindaHostId: 'foo',
              records: []
            }).then(function() {
              return record_set.get().then(function(result) {
                expect(result).to.be.an('array');
              });
            });
          });
          
          it('Should resolve with records from the bundle', function() {
            var record_set = recordSetFactory();
            
            return record_set.initialize({
              melindaHostId: 'foo',
              records: ['bar']
            }).then(function(result) {
              return record_set.get().then(function(result) {
                expect(result).to.be.an('array');
                expect(result).to.eql([{
                  melindaHostId: 'foo',
                  record: 'bar'
                }]);
              });
            });
          });
          
          it('Should resolve with converted record data from the bundle', function() {
            var record_set = recordSetFactory();
            
            return record_set.initialize({
              melindaHostId: 'foo',
              format: 'marc21slimXML',
              records: '<?xml version="1.0" encoding="UTF-8"?><collection firstRecordNumber="1" allRecordsCount="2"><record><leader>00000cam^a22000004i^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record><record><leader>00000caa^a22000004i^4500</leader><controlfield tag="001">000006001</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">bar</subfield></datafield><datafield tag="773" ind1="0" ind2=" "><subfield code="w">(FI-MELINDA)000006000</subfield></datafield></record></collection>'
            }).then(function() {
              return record_set.get().then(function(result) {
                expect(result).to.be.an('array');
                expect(result).to.eql([
                  {
                    melindaHostId: 'foo',
                    record: {
                      leader: '00000cam^a22000004i^4500',
                      fields: [
                        {
                          tag: '001',
                          value: '000006000'
                        },
                        {
                          tag: '245',
                          ind1: ' ',
                          ind2: ' ',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }
                  },
                  {
                    melindaHostId: 'foo',
                    record: {
                      leader: '00000caa^a22000004i^4500',
                      fields: [
                        {
                          tag: '001',
                          value: '000006001'
                        },
                        {
                          tag: '245',
                          ind1: ' ',
                          ind2: ' ',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773',
                          ind1: '0',
                          ind2: ' ',
                          subfields: [{
                            code: 'w',
                            value: '(FI-MELINDA)000006000'
                          }]
                        }
                      ]
                    }
                  }
                ]);
              });
            });
          });
          
          it('Should resolve with undefined because the bundle has been already retrieved', function() {
            var record_set = recordSetFactory();
            
            return record_set.initialize({
              melindaHostId: 'foo',
              records: []
            }).then(function() {
              return record_set.get().then(function(result) {
                expect(result).to.be.an('array');
                return record_set.get().then(function(result) {
                  expect(result).to.be.an('undefined');
                });
              });
            });
          });
          
        });

      });

    });

  });

}
