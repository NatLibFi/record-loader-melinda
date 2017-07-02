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
      '../../lib/hostcomp/hooks/related-records-retrieved/hostcomp'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('marc-record-js'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('../../lib/hostcomp/hooks/related-records-retrieved/hostcomp')
    );
  }
  
}(this, factory));

function factory(chai, chaiAsPromised, MarcRecord, Promise, hookFactory)
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
            
            var logger = {
              info: function() {},
              debug: function() {},
              error: function() {},
              warning: function() {}
            };
            
            it('Should return a Promise which resolves with an array', function() {
              return hookFactory().setLogger(logger).run([]).then(function(result) {
                expect(result).to.be.an('array');
              });
            });
            
            it('Should resolve because number of components are equal', function() {
              return hookFactory()
              .setLogger(logger)
              .setRecordStore({
                read: function() {
                  return Promise.resolve([new MarcRecord({
                    fields: []
                  })]);
                }
              })
              .run([{
                record: {
                  record: {
                    fields: []
                  }
                }}]).then(function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.eql([{
                    record: {
                      melindaHostId: undefined,
                      relatedRecordsRetrievedHook: {
                        difference: 0,
                        recordSet: 0,
                        recordStore: 0
                      },
                      record: {
                        leader: undefined,
                        fields: []
                      }
                    }
                  }]);
                });
              });
              
              it('Should resolve because record set has 0 components and record store more than 0', function() {
                return hookFactory()
                .setLogger(logger)
                .setRecordStore({
                  read: function() {
                    return Promise.resolve([new MarcRecord({
                      fields: [{
                        tag: '773'
                      }]
                    })]);
                  }
                })
                .run([{
                  record: {
                    record: {
                      fields: []
                    }
                  }}]).then(function(result) {
                    expect(result).to.be.an('array');
                    expect(result).to.eql([{
                      record: {
                        melindaHostId: undefined,
                        relatedRecordsRetrievedHook: {
                          difference: 1,
                          recordSet: 0,
                          recordStore: 1
                        },
                        record: {
                          leader: undefined,
                          fields: []
                        }
                      }
                    }]);
                  });
                });
                
                it('Should resolve because record set has more than 0 components and record store has 0', function() {
                  return hookFactory()
                  .setLogger(logger)
                  .setRecordStore({
                    read: function() {
                      return Promise.resolve([new MarcRecord({
                        fields: []
                      })]);
                    }
                  })
                  .run([{
                    record: {
                      record: {
                        fields: [{
                          tag: '773'
                        }]
                      }
                    }}]).then(function(result) {
                      expect(result).to.be.an('array');
                      expect(result).to.eql([{
                        record: {
                          melindaHostId: undefined,
                          relatedRecordsRetrievedHook: {
                            difference: 1,
                            recordSet: 1,
                            recordStore: 0
                          },
                          record: {
                            leader: undefined,
                            fields: [{
                              tag: '773'
                            }]
                          }
                        }
                      }]);
                    });
                  });
                  
                  it('Should fail because the treshold was exceeded', function() {
                    return hookFactory()
                    .setLogger(logger)
                    .setRecordStore({
                      read: function() {
                        return Promise.resolve([
                          new MarcRecord({
                            fields: [{
                              tag: '773'
                            }]
                          }),
                          new MarcRecord({
                            fields: [{
                              tag: '773'
                            }]
                          })
                        ]);
                      }
                    })
                    .run([{
                      record: {
                        record: {
                          fields: [{
                            tag: '773'
                          }]
                        }
                      }}]).then(function(result) {
                        expect(result).to.be.an('array');
                        expect(result).to.eql([{
                          failed: true,
                          record: {
                            melindaHostId: undefined,
                            relatedRecordsRetrievedHook: {
                              difference: 1,
                              recordSet: 1,
                              recordStore: 2
                            },
                            record: {
                              leader: undefined,
                              fields: [{
                                tag: '773'
                              }]
                            }
                          }
                        }]);
                      });
                    });
                    
                    it('Should succeed because the treshold was not exceeded', function() {
                      return hookFactory({
                        treshold: 1
                      })
                      .setLogger(logger)
                      .setRecordStore({
                        read: function() {
                          return Promise.resolve([
                            new MarcRecord({
                              fields: [{
                                tag: '773'
                              }]
                            }),
                            new MarcRecord({
                              fields: [{
                                tag: '773'
                              }]
                            })
                          ]);
                        }
                      })
                      .run([{
                        record: {
                          record: {
                            fields: [{
                              tag: '773'
                            }]
                          }
                        }}]).then(function(result) {
                          expect(result).to.be.an('array');
                          expect(result).to.eql([{
                            record: {
                              melindaHostId: undefined,
                              relatedRecordsRetrievedHook: {
                                difference: 1,
                                recordSet: 1,
                                recordStore: 2
                              },
                              record: {
                                leader: undefined,
                                fields: [{
                                  tag: '773'
                                }]
                              }
                            }
                          }]);
                        });
                      });
                    
                  });
                  
                });
                
              });
              
            });
            
          });
          
        }
