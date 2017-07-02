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
      '@natlibfi/http-client-x-mock/lib/browser/main',
      '../lib/record-store/melinda'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('marc-record-js'),
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/http-client-x-mock/lib/nodejs/main'),
      require('../lib/record-store/melinda')
    );
  }
  
}(this, factory));

function factory(chai, chaiAsPromised, MarcRecord, Promise, http_mock, recordStoreFactory)
{
  
  'use strict';
  
  var expect = chai.expect;
  
  chai.use(chaiAsPromised);
  
  describe('record-store', function() {
    
    describe('factory', function() {
      
      it('Should create the expected object', function() {
        expect(recordStoreFactory()).to.be.an('object')
        .and.to.respondTo('setLogger')
        .and.to.respondTo('rollback')
        .and.to.respondTo('create')
        .and.to.respondTo('read')
        .and.to.respondTo('update')
        .and.to.respondTo('delete');
      });
      
      describe('object', function() {
        
        var record_store = recordStoreFactory();       
        
        afterEach(http_mock.restore);
        
        describe('#setLogger', function() {
          
          it('Should return itself', function() {
            expect(record_store.setLogger()).to.eql(record_store);
          });
          
        });
        
        describe('#create', function() {
          
          it('Should return a Promise which resolves with an object', function() {
            return record_store.create().then(function(result) {
              expect(result).to.be.an('object');
            });
          });
          
          it('Should create a new record in the store', function(){          
            http_mock.create({
              url:'https://foo.bar/bib/',
              method: 'POST',
              status: 200,
              body: '<response><message>[0018] Document: 000006000 was updated successfully.</message></response>'
            });
            
            return recordStoreFactory({
              url: 'https://foo.bar/',
              user: 'foo',
              password: 'bar'
            }).create(new MarcRecord({
              fields: [{
                tag: '245',
                subfields: [{
                  code: 'a',
                  value: 'foobar'
                }]
              }]
            })).then(function(result) {
              expect(result).to.be.an.array /* jshint -W030 */;
              expect(result).to.eql({
                idList: ['000006000']
              });
            });
          });
          
          it('Should fail to create a new record in the store', function() {
            http_mock.create({
              url:'https://foo.bar/bib/',
              method: 'POST',
              status: 200,
              body: '<response><error>[0101] foo.- trigger error</error></response>'
            });
            
            return recordStoreFactory({
              url: 'https://foo.bar/',
              user: 'foo',
              password: 'bar'
            }).create(new MarcRecord({
              fields: [{
                tag: '245',
                subfields: [{
                  code: 'a',
                  value: 'foobar'
                }]
              }]
            })).catch(function(error) {
              expect(error.message).to.equal('{"messages":[],"errors":[{"code":"0101","message":"foo.- trigger error"}],"triggers":[],"warnings":[]}');
            });
          });
          
        });
        
        describe('#read', function() {
          
          it('Should return a Promise which resolves with an array', function() {
            return record_store.read({idList:[]}).then(function(result) {
              expect(result).to.be.an('array');
            });
          });
          
          it('Should fail because query is invalid', function(){
            return recordStoreFactory({
              url: 'https://foo.bar',
              user: 'foo',
              password: 'bar'
            }).read().catch(function(error) {
              expect(error).to.be.an('error');
              expect(error.message).to.equal('Invalid query object');
            });
          });
          
          it('Should fail to read a record from the store', function(){
            http_mock.create({
              url:'https://foo.bar/bib/6000',
              method: 'GET',
              status: 404
            });
            
            return recordStoreFactory({
              url: 'https://foo.bar',
              user: 'foo',
              password: 'bar'
            }).read({
              idList: ['6000']
            }).catch(function(error) {
              expect(error).to.be.an('error');
              expect(error.message).to.equal('{"status_code":404}');
            });
          });
          
          it('Should fail to read a record from the store and retry', function(){
            http_mock.create({
              url:'https://foo.bar/bib/6000',
              method: 'GET',
              status: 404
            });
            http_mock.create({
              url:'https://foo.bar/bib/6000',
              method: 'GET',
              status: 404
            });
            return recordStoreFactory({
              url: 'https://foo.bar',
              user: 'foo',
              password: 'bar',
              retry: 1
            }).read({
              idList: ['6000']
            }).catch(function(error) {
              expect(error).to.be.an('error');
              expect(error.message).to.equal('{"status_code":404}');
            });
          });
          
          it('Should read a record from the store', function(){
            http_mock.create({
              url:'https://foo.bar/bib/6000',
              method: 'GET',
              status: 200,
              body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a2200613zi^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
            });
            
            return recordStoreFactory({
              url: 'https://foo.bar',
              user: 'foo',
              password: 'bar'
            }).read({
              idList: ['6000']
            }).then(function(result) {
              expect(result).to.be.an.array /* jshint -W030 */;
              expect(result).to.have.length(1);
              expect(result[0].toJsonObject()).to.eql({
                leader: '^^^^^cam^a2200613zi^4500',
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
              });
            });
          });
          
          it('Should read host and component records from the store', function(){
            http_mock.create({
              url:'https://foo.bar/bib/6000/children?include_parent=1',
              method: 'GET',
              status: 200,
              body: '<?xml version="1.0" encoding="UTF-8"?><collection firstRecordNumber="1" allRecordsCount="2"><record><leader>00000cam^a22000004i^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record><record><leader>00000caa^a22000004i^4500</leader><controlfield tag="001">000006001</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">bar</subfield></datafield><datafield tag="773" ind1="0" ind2=" "><subfield code="w">(FI-MELINDA)000006000</subfield></datafield></record></collection>'
            });
            
            return recordStoreFactory({
              url: 'https://foo.bar',
              user: 'foo',
              password: 'bar'
            }).read({
              idList: ['6000'],
              fetchComponents: true
            }).then(function(result) {
              expect(result).to.be.an.array /* jshint -W030 */;
              expect(result).to.have.length(2);
              expect(result[0].toJsonObject()).to.eql({
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
              });
              expect(result[1].toJsonObject()).to.eql({
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
              });
            });
          });
          
          it('Should read a record from cache', function(){
            var record_store2;
            
            http_mock.create({
              url:'https://foo.bar/bib/6000',
              method: 'GET',
              status: 200,
              body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a2200613zi^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
            });
            
            record_store2 = recordStoreFactory({
              url: 'https://foo.bar',
              user: 'foo',
              password: 'bar',
              useCache: true
            }).setLogger({
              debug: function() {}
            });
            
            return record_store2.read({
              idList: ['6000']
            }).then(function(result) {
              expect(result).to.be.an.array /* jshint -W030 */;
              expect(result).to.have.length(1);
              expect(result[0].toJsonObject()).to.eql({
                leader: '^^^^^cam^a2200613zi^4500',
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
              });
              
              http_mock.restore();
              
              return record_store2.read({
                idList: ['6000']
              }).then(function(result) {
                expect(result).to.be.an.array /* jshint -W030 */;
                expect(result).to.have.length(1);
                expect(result[0].toJsonObject()).to.eql({
                  leader: '^^^^^cam^a2200613zi^4500',
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
                });
              });
            });  
          });
          
          it('Should read host and component records from the cache', function(){
            var record_store2;
            
            http_mock.create({
              url:'https://foo.bar/bib/6000',
              method: 'GET',
              status: 200,
              body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>00000cam^a22000004i^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
            });
            http_mock.create({
              url:'https://foo.bar/bib/6000/children?include_parent=1',
              method: 'GET',
              status: 200,
              body: '<?xml version="1.0" encoding="UTF-8"?><collection firstRecordNumber="1" allRecordsCount="2"><record><leader>00000cam^a22000004i^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record><record><leader>00000caa^a22000004i^4500</leader><controlfield tag="001">000006001</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">bar</subfield></datafield><datafield tag="773" ind1="0" ind2=" "><subfield code="w">(FI-MELINDA)000006000</subfield></datafield></record></collection>'
            });
            
            record_store2 = recordStoreFactory({
              url: 'https://foo.bar',
              user: 'foo',
              password: 'bar',
              useCache: true
            }).setLogger({
              debug: function() {}
            });
            
            return record_store2.read({
              idList: ['6000']
            }).then(function() {
              return record_store2.read({
                idList: ['6000'],
                fetchComponents: true
              }).then(function(result) {
                expect(result).to.be.an.array /* jshint -W030 */;
                expect(result).to.have.length(2);
                expect(result[0].toJsonObject()).to.eql({
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
                });
                expect(result[1].toJsonObject()).to.eql({
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
                });
                
                http_mock.restore();
                
                return record_store2.read({
                  idList: ['6000'],
                  fetchComponents: true
                }).then(function(result) {
                  expect(result).to.be.an.array /* jshint -W030 */;
                  expect(result).to.have.length(2);
                  expect(result[0].toJsonObject()).to.eql({
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
                  });
                  expect(result[1].toJsonObject()).to.eql({
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
                  });
                });
              });
            }).catch(function(e){console.log(e);});
          });
          
        });
        
        describe('#update', function() {
          
          it('Should return a Promise which resolves with an array', function() {
            return record_store.update({idList: []}, []).then(function(result) {
              expect(result).to.be.an('array');
            });
          });
          
          it('Should fail because of invalid query', function() {
            return recordStoreFactory({
              url: 'https://foo.bar/',
              user: 'foo',
              password: 'bar'
            }).update().catch(function(error) {
              expect(error).to.be.an('error');
              expect(error.message).to.equal('Invalid query object');
            });
          });
          
          it('Should fail because mismatch between record ids and data', function() {
            return recordStoreFactory({
              url: 'https://foo.bar/',
              user: 'foo',
              password: 'bar'
            }).update({
              idList: ['foo']
            }, []).catch(function(error) {
              expect(error).to.be.an('error');
              expect(error.message).to.equal('Number of record ids does not match the number of record data');
            });
          });
          
          it('Should fail to update a record in the store', function() {
            http_mock.create({
              url:'https://foo.bar//bib/6000',
              method: 'GET',
              status: 200,
              body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a2200613zi^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
            });
            http_mock.create({
              url:'https://foo.bar//bib/6000',
              method: 'PUT',
              status: 500
            });
            
            return recordStoreFactory({
              url: 'https://foo.bar/',
              user: 'foo',
              password: 'bar'
            }).update({
              idList: ['6000']
            }, [new MarcRecord({
              leader: '^^^^^cam^a2200613zi^4500',
              fields: [
                {
                  tag: '001',
                  value: '6000'
                },
                {
                  tag: '245',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                }]
              })]).catch(function(error) {
                expect(error).to.be.an('error');
                expect(error.message).to.equal('{"status_code":500}');
              });
            });
            
            it('Should update a record in the store', function(){
              http_mock.create({
                url:'https://foo.bar//bib/6000',
                method: 'GET',
                status: 200,
                body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a2200613zi^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
              });
              http_mock.create({
                url:'https://foo.bar//bib/6000',
                method: 'PUT',
                status: 200,
                body: '<response><message>[0018] Document: 000006000 was updated successfully.</message></response>'
              });
              
              return recordStoreFactory({
                url: 'https://foo.bar/',
                user: 'foo',
                password: 'bar'
              }).update({
                idList: ['6000']
              }, [new MarcRecord({
                leader: '^^^^^cam^a2200613zi^4500',
                fields: [
                  {
                    tag: '001',
                    value: '6000'
                  },
                  {
                    tag: '245',
                    subfields: [{
                      code: 'a',
                      value: 'foobar'
                    }]
                  }]
                })]).then(function(result) {
                  expect(result).to.be.an.array /* jshint -W030 */;
                  expect(result).to.have.length(1);
                  expect(result[0].toJsonObject()).to.eql({
                    leader: '^^^^^cam^a2200613zi^4500',
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
                  });
                });
              });
              
              it('Should update a record in the store and remove it from cache', function() {
                http_mock.create({
                  url:'https://foo.bar//bib/6000',
                  method: 'GET',
                  status: 200,
                  body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a2200613zi^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
                });
                http_mock.create({
                  url:'https://foo.bar//bib/6000',
                  method: 'PUT',
                  status: 200,
                  body: '<response><message>[0018] Document: 000006000 was updated successfully.</message></response>'
                });
                
                return recordStoreFactory({
                  url: 'https://foo.bar/',
                  user: 'foo',
                  password: 'bar',
                  useCache: true
                }).update({
                  idList: ['6000']
                }, [new MarcRecord({
                  leader: '^^^^^cam^a2200613zi^4500',
                  fields: [
                    {
                      tag: '001',
                      value: '6000'
                    },
                    {
                      tag: '245',
                      subfields: [{
                        code: 'a',
                        value: 'foobar'
                      }]
                    }]
                  })]).then(function(result) {
                    expect(result).to.be.an.array /* jshint -W030 */;
                    expect(result).to.have.length(1);
                    expect(result[0].toJsonObject()).to.eql({
                      leader: '^^^^^cam^a2200613zi^4500',
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
                    });
                  });
                });
                
                it('Should update a host record in the store and remove it from cache', function() {
                  var record_store2;
                  
                  http_mock.create({
                    url:'https://foo.bar/bib/6000/children?include_parent=1',
                    method: 'GET',
                    status: 200,
                    body: '<?xml version="1.0" encoding="UTF-8"?><collection firstRecordNumber="1" allRecordsCount="2"><record><leader>00000cam^a22000004i^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record><record><leader>00000caa^a22000004i^4500</leader><controlfield tag="001">000006001</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">bar</subfield></datafield><datafield tag="773" ind1="0" ind2=" "><subfield code="w">(FI-MELINDA)000006000</subfield></datafield></record></collection>'
                  });
                  
                  record_store2 = recordStoreFactory({
                    url: 'https://foo.bar',
                    user: 'foo',
                    password: 'bar',
                    useCache: true
                  }).setLogger({
                    debug: function() {}
                  });
                  
                  return record_store2.read({
                    idList: ['6000'],
                    fetchComponents: true
                  }).then(function(result) {
                    
                    http_mock.create({
                      url:'https://foo.bar/bib/6000',
                      method: 'GET',
                      status: 200,
                      body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a22000004i^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
                    });
                    http_mock.create({
                      url:'https://foo.bar/bib/6000',
                      method: 'PUT',
                      status: 200,
                      body: '<response><message>[0018] Document: 000006000 was updated successfully.</message></response>'
                    });
                    
                    return record_store2.read({
                      idList: ['6000'],
                      fetchComponents: true
                    }).then(function(result) {    
                      return record_store2.update({
                        idList: ['6000']
                      }, [new MarcRecord({
                        leader: '00000cam^a22000004i^4500',
                        fields: [
                          {
                            tag: '001',
                            value: '6000'
                          },
                          {
                            tag: '245',
                            subfields: [{
                              code: 'a',
                              value: 'foobar'
                            }]
                          }]
                        })]).then(function(result) {
                          expect(result).to.be.an.array /* jshint -W030 */;
                          expect(result).to.have.length(1);
                          expect(result[0].toJsonObject()).to.eql({
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
                          });
                        });
                      });
                    });
                    
                  });
                  
                  describe('#delete', function() {
                    
                    it('Should return a Promise which resolves with an array', function() {
                      return record_store.delete({idList: []}).then(function(result) {
                        expect(result).to.be.an('array');
                      });
                    });
                    
                    it('Should delete records from the store', function(){
                      http_mock.create({
                        url:'https://foo.bar/bib/6000',
                        method: 'GET',
                        status: 200,
                        body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a2200613zi^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
                      });
                      http_mock.create({
                        url:'https://foo.bar/bib/000006000',
                        method: 'GET',
                        status: 200,
                        body: '<?xml version="1.0" encoding="UTF-8"?><record><leader>^^^^^cam^a2200613zi^4500</leader><controlfield tag="001">000006000</controlfield><datafield tag="245" ind1=" " ind2=" "><subfield code="a">foo</subfield></datafield></record>'
                      });
                      http_mock.create({
                        url:'https://foo.bar/bib/000006000',
                        method: 'PUT',
                        status: 200,
                        body: '<response><message>[0018] Document: 000006000 was updated successfully.</message></response>'
                      });
                      
                      return recordStoreFactory({
                        url: 'https://foo.bar',
                        user: 'foo',
                        password: 'bar'
                      }).delete({
                        idList: ['6000']
                      }).then(function(result) {
                        expect(result).to.be.an.array /* jshint -W030 */;
                        expect(result).to.have.length(1);
                        expect(result[0].toJsonObject()).to.eql({
                          leader: '^^^^^cam^a2200613zi^4500',
                          fields: [
                            {
                              tag: '001',
                              value: '000006000'
                            },
                            {
                              tag: '245',
                              ind1: ' ',
                              ind2: ' ',
                              subfields: [
                                {
                                  code: 'a',
                                  value: 'foo'
                                }]
                              },
                              {
                                tag: 'STA',
                                ind1: ' ',
                                ind2: ' ',
                                subfields: [
                                  {
                                    code: 'a',
                                    value: 'DELETED'
                                  }]
                                }
                              ]
                            });
                          });
                        });                      
                      });
                      
                    });
                    
                    describe('#rollback', function() {
                      
                      it('Should return a Promise and resolve with undefined', function() {
                        return record_store.rollback({
                          created: { idList: [] },
                          deleted: [],
                          updated: []
                        }).then(function(result) {
                          expect(result).to.eql({idList: []});
                        });
                      });
                      
                      it.skip('Should roll back the changes done by #create');
                      
                    });
                    
                  });
                  
                });
                
              });
              
            }
