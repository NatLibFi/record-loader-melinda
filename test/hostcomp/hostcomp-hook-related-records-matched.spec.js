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
      'simple-mock',
      'marc-record-js',
      '@natlibfi/es6-polyfills/lib/polyfills/promise',
      '../../lib/hostcomp/hooks/related-records-matched/hostcomp'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('simple-mock'),
      require('marc-record-js'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('../../lib/hostcomp/hooks/related-records-matched/hostcomp')
    );
  }
  
}(this, factory));

function factory(chai, chaiAsPromised, simple, MarcRecord, Promise, hookFactory)
{
  
  'use strict';
  
  var expect = chai.expect;
  
  chai.use(chaiAsPromised);
  
  describe('hooks', function() {
    
    describe('related-records-matched', function() {
      
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
              var hook2 = hookFactory().setRecordStore({
                read: function() {
                  return Promise.resolve([]);
                }
              });
              return hook2.run([{
                melindaHostId: 'foo',
                record: new MarcRecord({fields: []}),
                matchedRecords: []
              }]).catch(function(result) {
                expect(result).to.be.an('array');
              });
            });
            
            describe('#normalizeMatches', function() {
              it('Should reject because some records had multiple matches', function() {
                var hook2 = hookFactory().setRecordStore({
                  read: function() {
                    return Promise.resolve([
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'fubar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      })
                    ]);
                  }
                });
                return hook2.run([
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }]
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: [
                      {
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          }
                        ]
                      },
                      {
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'fubar'
                            }]
                          }
                        ]
                      }
                    ]
                  }
                ]).then(function() {
                  throw new Error();
                }, function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.have.length(2);
                  expect(result[1].failed).to.be.true /* jshint -W030 */;
                  expect(result[1].message).to.equal('Multiple matches not allowed');
                });
              });
              
              it('Should remove multiple matches for a record', function() {
                var hook2 = hookFactory().setRecordStore({
                  read: function() {
                    return Promise.resolve([
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'fubar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      })
                    ]);
                  }
                });
                return hook2.run([
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }]
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12346'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12346'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773',
                          subfields: []
                        }
                      ]
                    }]
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12347'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'fubar'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: [
                      {
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773',
                            subfields: []
                          }
                        ]
                      },
                      {
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'fubar'
                            }]
                          },
                          {
                            tag: '773',
                            subfields: []
                          }
                        ]
                      }
                    ]
                  }
                ]).then(function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.have.length(3);
                  expect(result[2].normalization).to.eql({
                    multiMatchesRemoved: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12346'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773',
                          subfields: []
                        }
                      ]
                    }]
                  });
                });
              });
              
              it('Should find a match for a host record which had no matches', function() {
                var hook2 = hookFactory().setRecordStore({
                  read: function() {
                    return Promise.resolve([new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    })]);
                  }
                });
                return hook2.run([{
                  melindaHostId: 'foo',
                  record: new MarcRecord({
                    fields: [
                      {
                        tag: '001',
                        value: '12345'
                      },
                      {
                        tag: '245',
                        subfields: [{
                          code: 'a',
                          value: 'foo'
                        }]
                      }
                    ]
                  }),
                  matchedRecords: []
                }]).then(function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.have.length(1);
                  expect(result[0].normalization).to.eql({
                    foundMissing: true
                  });
                  expect(result[0].matchedRecords).to.have.length(1);
                  expect(result[0].matchedRecords[0].toJsonObject()).to.eql({
                    leader: undefined,
                    fields: [
                      {
                        tag: '001',
                        value: '12345'
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
                });
              });
              
              it('Should find a match for a component record which had no matches', function() {
                var hook2 = hookFactory().setRecordStore({
                  read: function() {
                    return Promise.resolve([
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      })
                    ]);
                  }
                });
                return hook2.run([
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }]
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '12346'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }),
                    matchedRecords: []
                  }
                ]).then(function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.have.length(2);
                  expect(result[1].normalization).to.eql({
                    foundMissing: true
                  });
                  expect(result[1].matchedRecords).to.have.length(1);
                  expect(result[1].matchedRecords[0].toJsonObject()).to.eql({
                    leader: undefined,
                    fields: [
                      {
                        tag: '001',
                        value: '12346'
                      },
                      {
                        tag: '245',
                        subfields: [{
                          code: 'a',
                          value: 'bar'
                        }]
                      },
                      {
                        tag: '773'
                      }
                    ]
                  });
                });
              });
              
              it('Should fail to find a match for a record', function() {
                var hook2 = hookFactory().setRecordStore({
                  read: function() {
                    return Promise.resolve([
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773',
                            subfields: []
                          }
                        ]
                      })
                    ]);
                  }
                });
                return hook2.run([{
                  melindaHostId: 'foo',
                  record: new MarcRecord({
                    fields: [
                      {
                        tag: '001',
                        value: '12345'
                      },
                      {
                        tag: '245',
                        subfields: [{
                          code: 'a',
                          value: 'foo'
                        }]
                      }
                    ]
                  }),
                  matchedRecords: []
                }]).then(function() {
                  throw new Error();
                }, function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.have.length(1);
                  expect(result[0].failed).to.be.true /* jshint -W030 */;
                  expect(result[0].message).to.equal('Records without matches not allowed');
                });
              });
              
              it('Should find matches by index for records with no matches', function() {
                var hook2 = hookFactory({
                  findMissingByIndex: true
                }).setRecordStore({
                  read: function() {
                    return Promise.resolve([
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12348'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12349'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      })
                    ]);
                  }
                });
                return hook2.run([
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: []
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2346'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12346'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }]
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2347'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }),
                    matchedRecords: []
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2348'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12348'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }]
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2349'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }),
                    matchedRecords: []
                  }
                ]).then(function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.have.length(5);
                  expect(result[0].normalization).to.eql({
                    foundMissingByIndex: true
                  });
                  expect(result[0].matchedRecords).to.have.length(1);
                  expect(result[0].matchedRecords[0].toJsonObject()).to.eql({
                    leader: undefined,
                    fields: [
                      {
                        tag: '001',
                        value: '12345'
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
                  expect(result[2].normalization).to.eql({
                    foundMissingByIndex: true
                  });
                  expect(result[2].matchedRecords).to.have.length(1);
                  expect(result[2].matchedRecords[0].toJsonObject()).to.eql({
                    leader: undefined,
                    fields: [
                      {
                        tag: '001',
                        value: '12347'
                      },
                      {
                        tag: '245',
                        subfields: [{
                          code: 'a',
                          value: 'bar'
                        }]
                      },
                      {
                        tag: '773'
                      }
                    ]
                  });
                  expect(result[4].normalization).to.eql({
                    foundMissingByIndex: true
                  });
                  expect(result[4].matchedRecords).to.have.length(1);
                  expect(result[4].matchedRecords[0].toJsonObject()).to.eql({
                    leader: undefined,
                    fields: [
                      {
                        tag: '001',
                        value: '12349'
                      },
                      {
                        tag: '245',
                        subfields: [{
                          code: 'a',
                          value: 'bar'
                        }]
                      },
                      {
                        tag: '773'
                      }
                    ]
                  });
                });
              });
              
              it('Should fail to find matches by index because surrounding records have the same id', function() {
                var hook2 = hookFactory({
                  findMissingByIndex: true
                }).setRecordStore({
                  read: function() {
                    return Promise.resolve([
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }),
                      new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12348'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      })
                    ]);
                  }
                });
                return hook2.run([
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12345'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'foo'
                          }]
                        }
                      ]
                    }]
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2346'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }),
                    matchedRecords: []
                  },
                  {
                    melindaHostId: 'foo',
                    record: new MarcRecord({
                      fields: [
                        {
                          tag: '001',
                          value: '2347'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773',
                          subfields: []
                        }
                      ]
                    }),
                    matchedRecords: [{
                      fields: [
                        {
                          tag: '001',
                          value: '12348'
                        },
                        {
                          tag: '245',
                          subfields: [{
                            code: 'a',
                            value: 'bar'
                          }]
                        },
                        {
                          tag: '773'
                        }
                      ]
                    }]
                  }
                ]).then(function() {
                  throw new Error();
                }, function(result) {
                  expect(result).to.be.an('array');
                  expect(result).to.have.length(3);
                  expect(result[1].failed).to.be.true /* jshint -W030 */;
                  expect(result[1].message).to.equal('Records without matches not allowed');
                });
              });
              
              describe('#checkDifference', function() {
                it('Should reject because there were too many extraneous records in the input records sets', function() {
                  var hook2 = hookFactory({
                    difference: {
                      recordSet: 0
                    }
                  }).setRecordStore({
                    read: function() {
                      return Promise.resolve([
                        new MarcRecord({
                          fields: [
                            {
                              tag: '001',
                              value: '22345'
                            },
                            {
                              tag: '245',
                              subfields: [{
                                code: 'a',
                                value: 'foo'
                              }]
                            }
                          ]
                        }),
                        new MarcRecord({
                          fields: [
                            {
                              tag: '001',
                              value: '22346'
                            },
                            {
                              tag: '245',
                              subfields: [{
                                code: 'a',
                                value: 'bar'
                              }]
                            },
                            {
                              tag: '773'
                            }
                          ]
                        })
                      ]);
                    }
                  });
                  return hook2.run([
                    {
                      melindaHostId: 'foo',
                      record: new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      matchedRecords: [{
                        fields: [
                          {
                            tag: '001',
                            value: '22345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }]
                    },
                    {
                      melindaHostId: 'foo',
                      record: new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          }
                        ]
                      }),
                      matchedRecords: [{
                        fields: [
                          {
                            tag: '001',
                            value: '22346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }]
                    },
                    {
                      melindaHostId: 'foo',
                      record: new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'fubar'
                            }]
                          }
                        ]
                      }),
                      matchedRecords: [{
                        fields: [
                          {
                            tag: '001',
                            value: '22346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }]
                    }
                  ]).then(function() {
                    throw new Error();
                  }, function(result) {
                    expect(result).to.be.an('array');
                    expect(result).to.have.length(3);
                    expect(result[0].failed).to.be.true /* jshint -W030 */;
                    expect(result[0].message).to.equal('Too many extraneous input records in the host-component set');
                  });
                });
                
                it('Should reject because there were too many extraneous records in record store set', function() {
                  var hook2 = hookFactory({
                    difference: {
                      recordStore: 0
                    }
                  }).setRecordStore({
                    read: function() {
                      return Promise.resolve([
                        new MarcRecord({
                          fields: [
                            {
                              tag: '001',
                              value: '22345'
                            },
                            {
                              tag: '245',
                              subfields: [{
                                code: 'a',
                                value: 'foo'
                              }]
                            }
                          ]
                        }),
                        new MarcRecord({
                          fields: [
                            {
                              tag: '001',
                              value: '22346'
                            },
                            {
                              tag: '245',
                              subfields: [{
                                code: 'a',
                                value: 'bar'
                              }]
                            },
                            {
                              tag: '773'
                            }
                          ]
                        }),
                        new MarcRecord({
                          fields: [
                            {
                              tag: '001',
                              value: '22347'
                            },
                            {
                              tag: '245',
                              subfields: [{
                                code: 'a',
                                value: 'bar'
                              }]
                            },
                            {
                              tag: '773'
                            }
                          ]
                        }),
                        new MarcRecord({
                          fields: [
                            {
                              tag: '001',
                              value: '22348'
                            },
                            {
                              tag: '245',
                              subfields: [{
                                code: 'a',
                                value: 'bar'
                              }]
                            },
                            {
                              tag: '773'
                            }
                          ]
                        })
                      ]);
                    }
                  });
                  return hook2.run([
                    {
                      melindaHostId: 'foo',
                      record: new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }),
                      matchedRecords: [{
                        fields: [
                          {
                            tag: '001',
                            value: '22345'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foo'
                            }]
                          }
                        ]
                      }]
                    },
                    {
                      melindaHostId: 'foo',
                      record: new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          }
                        ]
                      }),
                      matchedRecords: [{
                        fields: [
                          {
                            tag: '001',
                            value: '22346'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'bar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }]
                    },
                    {
                      melindaHostId: 'foo',
                      record: new MarcRecord({
                        fields: [
                          {
                            tag: '001',
                            value: '12347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'fubar'
                            }]
                          }
                        ]
                      }),
                      matchedRecords: [{
                        fields: [
                          {
                            tag: '001',
                            value: '22347'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'fubar'
                            }]
                          },
                          {
                            tag: '773'
                          }
                        ]
                      }]
                    }
                  ]).then(function() {
                    throw new Error();
                  }, function(result) {
                    expect(result).to.be.an('array');
                    expect(result).to.have.length(3);
                    expect(result[0].failed).to.be.true /* jshint -W030 */;
                    expect(result[0].message).to.equal('Too many extraneous record store records in the host-component set');
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
