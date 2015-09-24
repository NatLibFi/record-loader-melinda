/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2015 University Of Helsinki (The National Library Of Finland)
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
 * for the JavaScript code in this page.
 *
 **/

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['es6-polyfills/lib/promise', 'marc-record-js'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('es6-polyfills/lib/promise'), require('marc-record-js'));
    }

}(this, factory));

function factory(Promise, MarcRecord)
{

    'use strict';

    return function(parameters) {

	return {
	    /**
	     * @internal POST <melinda-api-endpoint>/bib/
	     */
	    'create': function(record, options)
	    {
		return Promise.reject('Not implemented');
	    },
	    /**
	     * @internal GET <sru-endpoint>?version=1.2&operation=searchRetrieve&query=<query>
	     */
	    'read': function(query)
	    {
		return Promise.reject('Not implemented');
	    },
	    /**
	     * @internal PUT <melinda-api-endpoint>/bib/<record-id>
	     */
	    'update': function(query, record, options)
	    {
		return Promise.reject('Not implemented');
	    },
	    /**
	     * @internal DELETE <melinda-api-endpoint>/bib/<record-id>
	     */
	    'delete': function(query)
	    {
		return Promise.reject('Not implemented');
	    },
	    'toggleTransaction': function(toggle)
	    {
		return Promise.reject('Not implemented');
	    },
	    'rollback': function()
	    {
		return Promise.reject('Not implemented');
	    }
	};

    };

}