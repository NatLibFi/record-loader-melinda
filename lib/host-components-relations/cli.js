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
        define(['./main', 'fs'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./main'), require('fs'));
    }

}(this, factory));

function factory(hostComponentsRelations, fs)
{

    'use strict';

    return function(name, argv, console, std_streams)
    {
	
	var usage = 'Usage: ' + name + ' <RECORD_STORE_HOST_ID> <DATA_FILE> <DATA_CONTENT_TYPE>\n'
	    + 'Create new host-components-relations bundle\n';
	
	if (argv.length < 3) {
	    console.log(usage);
	    return 1;
	} else {
	    console.log(hostComponentsRelations(
		argv[0],
		fs.readFileSync(argv[1], {encoding: 'utf8'}),
		argv[2]
	    ));
	}

    };

}