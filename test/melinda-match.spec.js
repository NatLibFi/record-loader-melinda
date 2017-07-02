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
      'marc-record-js',
      '@natlibfi/record-loader-prototypes/lib/logger/prototype',
      '@natlibfi/record-loader-prototypes/lib/record-store/prototype',
      '../lib/processors/match/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('marc-record-js'),
      require('@natlibfi/record-loader-prototypes/lib/logger/prototype'),
      require('@natlibfi/record-loader-prototypes/lib/record-store/prototype'),
      require('../lib/processors/match/melinda')
    );
  }
  
}(this, factory));

function factory(chai, chaiAsPromised, Promise, MarcRecord, loggerFactory, recordStoreFactory, processorFactory)
{
  
  'use strict';
  
  var expect = chai.expect;
  
  chai.use(chaiAsPromised);
  
  describe('processors', function() {
    
    describe('match', function() {
      
      describe('factory', function() {
        
        it('Should create the expected object', function() {
          expect(processorFactory()).to.be.an('object')
          .and.to.respondTo('setLogger')
          .and.to.respondTo('setReadRecordStore')
          .and.to.respondTo('findMatchCandidates')
          .and.to.respondTo('run');
        });
        
        describe('object', function() {
          
          describe('#setLogger', function() {
            
            it('Should return itself', function() {
              
              var processor = processorFactory();
              
              expect(processor.setLogger()).to.eql(processor);
              
            });
            
          });
          
          describe('#setReadRecordStore', function() {
            
            it('Should return itself', function() {
              
              var processor = processorFactory();
              
              expect(processor.setReadRecordStore()).to.eql(processor);
              
            });
            
          });
          
          describe('#findMatchCandidates', function() {
            
            it('Should resolve with an array of records', function() {
              return processorFactory().findMatchCandidates({}).then(function(result) {
                expect(result).to.be.an('array');
              });
            });
            
          });
          
          describe('#run', function() {
            
            var processor = processorFactory({
              
              match: {
                treshold: 50,
                tests: []
              }
              
            }).setLogger(loggerFactory().createInstance('foobar'))
            .setReadRecordStore(recordStoreFactory().read),
            processor_rank = processorFactory({
              
              match: {
                treshold: 50,
                tests: []
              },
              rank: {
                features: [{
                  extractor: {
                    name:'fieldCount',
                    parameters: ['001']
                  },
                  normalizer: 'lexical'
                }]
              }
              
            }).setLogger(loggerFactory().createInstance('foobar'))
            .setReadRecordStore(recordStoreFactory().read);            
            
            processor.findMatchCandidates = processor_rank.findMatchCandidates = function(record) {
              return Promise.resolve([
                new MarcRecord({
                  fields: [{
                    tag: '001',
                    value: 'foo'
                  },
                  {
                    tag: '001',
                    value: 'foo'
                  }]
                }),
                new MarcRecord({
                  fields: [{
                    tag: '001',
                    value: 'bar'
                  }]
                })
              ]);
            };
            
            it('Should return a Promise which resolves with the expected object', function() {
              
              var input_record = {
                fields: [{
                  tag: '001',
                  value: 'foobar'
                }]
              };
              
              return processor.run(input_record).then(function(result) {
                
                expect(result).to.be.an('object').and.to.have.all.keys(['matchedRecords', 'matchDetails']);
                expect(result.matchedRecords).to.be.an('array').and.to.have.length(2);
                expect(result.matchDetails).to.be.an('array').and.to.eql([
                  {
                    match: true,
                    points: 50,
                    tests: []
                  },
                  {
                    match: true,
                    points: 50,
                    tests: []
                  }
                ]);
                
              });
              
            });
            
            it('Should resolve with a single match because ranking is used', function() {
              
              var input_record = {
                fields: [{
                  tag: '001',
                  value: 'foobar'
                }]
              };
              
              return processor_rank.run(input_record).then(function(result) {
                
                var fn_orig_processor_rank_find_match_candidates = processor_rank.findMatchCandidate;
                
                expect(result).to.be.an('object').and.to.have.all.keys(['matchedRecords', 'matchDetails']);
                expect(result.matchedRecords).to.be.an('array').and.to.have.length(1);
                expect(result.matchDetails).to.be.an('array').and.to.eql([
                  {
                    match: true,
                    points: 50,
                    tests: []
                  },
                  {
                    match: true,
                    points: 50,
                    tests: []
                  }
                ]);
                
                processor_rank.findMatchCandidates = function(record) {
                  return Promise.resolve([
                    
                    new MarcRecord({
                      fields: [{
                        tag: '001',
                        value: 'bar'
                      }]
                    }),
                    new MarcRecord({
                      fields: [{
                        tag: '001',
                        value: 'foo'
                      },
                      {
                        tag: '001',
                        value: 'foo'
                      }]
                    })
                  ]);
                };
                
                return processor_rank.run(input_record).then(function(result) {
                  
                  processor_rank.findMatchCandidates = fn_orig_processor_rank_find_match_candidates;
                  
                  expect(result).to.be.an('object').and.to.have.all.keys(['matchedRecords', 'matchDetails']);
                  expect(result.matchedRecords).to.be.an('array').and.to.have.length(1);
                  expect(result.matchDetails).to.be.an('array').and.to.eql([
                    {
                      match: true,
                      points: 50,
                      tests: []
                    },
                    {
                      match: true,
                      points: 50,
                      tests: []
                    }
                  ]);
                });
                
              });
              
            });
            
          });
          
        });
        
      });
      
    });
    
  });
  
}
