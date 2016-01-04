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

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

    'use strict';

    if (typeof define === 'function' && define.amd) {
        define(['mimemessage'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('mimemessage'));
    }

}(this, factory));

/**
* @todo Works only on Node.js because of mimemessage 
*/
function factory(mimemessage)
{

    'use strict';

    return function(id, data, data_format)
    {

	var msg = mimemessage.factory({
	    body: []
	}),
	msg_id = mimemessage.factory({
	    contentType: 'text/plain;charset=utf8',
	    body: id
	}),
	msg_data = mimemessage.factory({
	    contentType: data_format,
	    body: data
	});
	
	msg_id.header('Content-Host-Components-Relations-Type', 'id');
	msg_data.header('Content-Host-Components-Relations-Type', 'data');
	
	msg.body.push(msg_id, msg_data);
	
	return msg.toString();

    };

}