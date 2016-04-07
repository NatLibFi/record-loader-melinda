/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2015-2016 University Of Helsinki (The National Library Of Finland)
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

(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['chai/chai', 'chai-as-promised', '../lib/record-store/melinda'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('chai'), require('chai-as-promised'), require('../lib/record-store/melinda'));
  }

}(this, factory));

function factory(chai, chaiAsPromised, recordStoreFactory)
{

  'use strict';

  return function(http_mock)
  {

    var expect = chai.expect;
    
    chai.use(chaiAsPromised);

    describe('record-store', function() {

      describe('factory', function() {

        it('Should be a function', function() {
          expect(recordStoreFactory).to.be.a('function');
        });

        it('Should throw because of invalid parameters', function() {
          expect(recordStoreFactory).to.throw(Error, /VALIDATION_INVALID_TYPE/);
        });

        it('Should return the expected object', function() {
          expect(recordStoreFactory({
            melinda: {
              endpoint: 'foobar://foo.bar',
              username: 'foo',
              password: 'bar'
            }
          })).to.be.an('object').and.to
            .respondTo('setConverter').and.to
            .respondTo('setLogger').and.to
            .respondTo('toggleTransaction').and.to
            .respondTo('rollback').and.to
            .respondTo('create').and.to
            .respondTo('read').and.to
            .respondTo('update').and.to
            .respondTo('delete');
        });

        describe('object', function() {

          var store = recordStoreFactory({
            melinda: {
              endpoint: 'http://foo.bar',
              username: 'foo',
              password: 'bar'
            }
          });
          
          it('Should set the logger succesfully', function() {
            expect(store.setLogger).to.not.throw();
          });

          it('Should set the converter succesfully', function() {
            expect(store.setConverter).to.not.throw();
          });

          it('Should toggle the transaction option succesfully', function() {
            expect(store.toggleTransaction).to.not.throw();
          });

          describe('#create', function() {

            afterEach(function() {
              http_mock.restore();
            });
            
            it('Should reject because record is invalid');

            it('Should create the record successfully and resolve with the expected object', function() {

              http_mock.create({
                url: 'http://foo.bar',
                body: JSON.stringify({
                  id: 'foo'
                })
              });

              expect(store.create()).to.eventually.be.eql({id: 'foo'});

            });
            
          });

          describe('#read', function() {

            it('Should read records successfully and return an array of records');

          });

          describe('#update', function() {

            it('Should update the record successfully and return the expected object');

          });

          describe('#delete', function() {

            it('Should delete the record successfully');

          });

          describe('#rollback', function() {

            it('Should perform a rollback succesfully');

          });

        });

      });

    });

  };

}
