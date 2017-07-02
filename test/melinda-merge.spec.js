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
      '../lib/processors/merge/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('../lib/processors/merge/melinda')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, processorFactory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);
  
  describe('processors', function() {

    describe('merge', function() {

      describe('factory', function() {

        it('Should create the expected object', function() {
          expect(processorFactory()).to.be.an('object')
            .and.to.respondTo('setLogger')
            .and.to.respondTo('run');
        });

        describe('object', function() {

          var processor = processorFactory();

          describe('#setLogger', function() {

            it('Should return itself', function() {
              expect(processor.setLogger()).to.eql(processor);
            });

          });

          describe('#run', function() {

            var input_record = {
              fields: [
                {
                  tag: '001',
                  value: 'foo'
                },
                {
                  tag: '245',
                  subfields: [{
                    code: 'a',
                    value: 'foo'
                  }]
                }
              ]
            },
            matched_records = [{
              fields: [
                {
                  tag: '001',
                  value: 'bar'
                },
                {
                  tag: '245',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                }
              ]
            }];
            
            it('Should resolve with a merged record which has the record store record as a base', function() {
              return processor.run(input_record, matched_records).then(function(result) {

                expect(result).to.be.an('object').and.to.contain.all.keys(['record' ,'mergedRecords']);
                expect(result.record).to.be.an('object');
                expect(result.record.toJsonObject()).to.eql({
                  leader: undefined,
                  fields: [
                    {
                      tag: '001',
                      value: 'bar',
                      fromPreferred: true,
                      wasUsed: true
                    },
                    {
                      tag: '245',
                      subfields: [{
                        code: 'a',
                        value: 'foobar'
                      }],
                      fromPreferred: true,
                      wasUsed: true
                    }
                  ]
                });
                expect(result.mergedRecords).to.be.an('array').and.to.have.length(1);
                expect(result.mergedRecords).to.eql(matched_records);
                
              });
            });
            
            it('Should resolve with the input record because there were no matched records', function() {
              return processor.run(input_record, []).then(function(result) {

                expect(result).to.be.an('object').and.to.contain.all.keys(['record' ,'mergedRecords']);
                expect(result.record).to.be.an('object');
                expect(result.record).to.eql({
                  fields: [
                    {
                      tag: '001',
                      value: 'foo'
                    },
                    {
                      tag: '245',
                      subfields: [{
                        code: 'a',
                        value: 'foo'
                      }]
                    }
                  ]
                });
                expect(result.mergedRecords).to.be.an('array').and.to.have.length(0);
                
              });
            });
            
            it('Should reject because multiple matches are not supported', function() {
              return processor.run(input_record, [{}, {}]).catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                expect(error.message).to.match(/^Merging is only supported with one matched record$/);
              });
            });

            it('Should resolve with a merged record which has the record set record as a base', function() {
              return processorFactory({
                rank: {
                  preferRecordSet: true
                }
              }).run(input_record, matched_records).then(function(result) {

                expect(result).to.be.an('object').and.to.contain.all.keys(['record' ,'mergedRecords']);
                expect(result.record).to.be.an('object');
                expect(result.record.toJsonObject()).to.eql({
                  leader: undefined,
                  fields: [
                    {
                      tag: '001',
                      value: 'foo',
                      fromPreferred: true,
                      wasUsed: true
                    },
                    {
                      tag: '245',
                      subfields: [{
                        code: 'a',
                        value: 'foo'
                      }],
                      fromPreferred: true,
                      wasUsed: true
                    }
                  ]
                });
                expect(result.mergedRecords).to.be.an('array').and.to.have.length(1);
                expect(result.mergedRecords).to.eql(matched_records);
              });
            });
            
            it('Should resolve with a merged record which has the better ranking record as a base (Record set record ranks better)', function() {
              return processorFactory({
                rank: {
                  features: []
                }
              }).run(input_record, matched_records).then(function(result) {
                
                expect(result).to.be.an('object').and.to.contain.all.keys(['record' ,'mergedRecords']);
                expect(result.record).to.be.an('object');
                expect(result.record.toJsonObject()).to.eql({
                  leader: undefined,
                  fields: [
                    {
                      tag: '001',
                      value: 'foo',
                      fromPreferred: true,
                      wasUsed: true
                    },
                    {
                      tag: '245',
                      subfields: [{
                        code: 'a',
                        value: 'foo'
                      }],
                      fromPreferred: true,
                      wasUsed: true
                    }
                  ]
                });
                expect(result.mergedRecords).to.be.an('array').and.to.have.length(1);
                expect(result.mergedRecords).to.eql(matched_records);
              });
              
            });

            it('Should resolve with a merged record which has the better ranking record as a base (Record store record ranks better)', function() {
              return processorFactory({
                rank: {
                  features: [{
                    extractor: {
                      name: 'fieldLength',
                      parameters: ['245']
                    },
                    normalizer: 'lexical'
                  }]
                }
              }).run(input_record, matched_records).then(function(result) {
                
                expect(result).to.be.an('object').and.to.contain.all.keys(['record' ,'mergedRecords']);
                expect(result.record).to.be.an('object');
                expect(result.record.toJsonObject()).to.eql({
                  leader: undefined,
                  fields: [
                    {
                      tag: '001',
                      value: 'bar',
                      fromPreferred: true,
                      wasUsed: true
                    },
                    {
                      tag: '245',
                      subfields: [{
                        code: 'a',
                        value: 'foobar'
                      }],
                      fromPreferred: true,
                      wasUsed: true
                    }
                  ]
                });
                expect(result.mergedRecords).to.be.an('array').and.to.have.length(1);
                expect(result.mergedRecords).to.eql(matched_records);
              });
              
            });

            it('Should resolve with a merged record and run validators', function() {
              var input_record2 = {
                fields: [
                  {
                    tag: '001',
                    value: 'foo'
                  },
                  {
                    tag: '700',
                    subfields: [{
                      code: 'e',
                      value: 'foobar,,'
                    }]
                  }
                ]
              };
              
              return processorFactory({
                rank: {
                  preferRecordSet: true
                },
                validate: {
                  fix: true,
                  validators: ['double-commas']
                }
              }).run(input_record2, matched_records).then(function(result) {

                expect(result).to.be.an('object').and.to.contain.all.keys(['record' ,'mergedRecords', 'mergeDetails']);
                expect(result.record).to.be.an('object');
                expect(result.record.toJsonObject()).to.eql({
                  leader: undefined,
                  fields: [
                    {
                      tag: '001',
                      value: 'foo',
                      fromPreferred: true,
                      wasUsed: true
                    },
                    {
                      tag: '700',
                      subfields: [{
                        code: 'e',
                        value: 'foobar,'
                      }],
                      fromPreferred: true,
                      wasUsed: true
                    }
                  ]
                });
                expect(result.mergedRecords).to.be.an('array').and.to.have.length(1);
                expect(result.mergedRecords).to.eql(matched_records);
                expect(result.mergeDetails.validate).to.eql({
                  failed: false,
                  validators: [{
                    name: 'double-commas',
                    "fix": [
                      {
                        "new": {
                          "fromPreferred": true,
                          "subfields": [
                            {
                              "code": "e",
                              "value": "foobar,"
                            }
                          ],
                          "tag": "700",
                          "wasUsed": true
                        },
                        "old": {
                          "fromPreferred": true,
                          "subfields": [
                            {
                              "code": "e",
                              "value": "foobar,,"
                            }
                          ],
                          "tag": "700",
                          "wasUsed": true
                        },
                        "type": "modifyField"
                      }
                    ],
                    "validate": [
                      {
                        "field": {
                          "fromPreferred": true,
                          "subfields": [
                            {
                              "code": "e",
                              "value": "foobar,,"
                            }
                          ],
                          "tag": "700",
                          "wasUsed": true
                        },
                        "message": "Double comma at subfield 'e'",
                        "type": "warning"
                      }
                    ]
                  }]
                });
              });
            });
            
          });
          
        });
        
      });
      
    });
    
  });
  
}
