/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda related modules for recordLoader
 *
 * Copyright (c) 2016 University Of Helsinki (The National Library Of Finland)
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

module.exports = function(name, argv, console, std_streams)
{

    'use strict';
    
    function generateUpdatedFilename(ids_merged, tries)
    {

	var filename = typeof last_filename === 'string' ? last_filename : ids_merged.join('_');

	if (typeof tries === 'number') {
	    filename += '_' + tries;
	} else {
	    tries = 0;
	}

	if (tries > 10) {
	    throw new Error();
	}

	filename += '-update.seq';

	return filenames_written.updated.indexOf(filename) >= 0
	    ? generateUpdatedFilename(ids_merged, tries + 1)
	    : filename;

    }

    var results,
    directory = process.cwd(),
    filenames_written = {
	'new': [],
	'updated': []
    },
    path = require('path'),
    fs = require('fs'),
    usage = 'Usage: ' + name + ' <RECORD_LOADER_RESULTS_FILE> [TARGET_DIRECTORY]\n'
	+ 'Create files from record data specified by <RECORD_LOADER_RESULTS_FILE> (Results must contain actual record data in addition to metadata)\n\nOptions:\n\tTARGET_DIRECTORY\tSpecifies the directory where the files are written. Defaults to current working directory';
    
    if (argv.length < 1) {
	console.log(usage);
	return 1;
    } else {

	if (argv.length > 1) {
	    directory = argv[1];
	}

	try {

	    results = JSON.parse(fs.readFileSync(argv[0], {encoding: 'utf8'}));

	} catch (e) {
	    console.error('Cannot parse results file: ' + e.message);
	    return -1;
	}

	if (results.records.some(function(result) {
	    
	    var filename;
	    
	    if (result.merged.length === 0) {
		filename = (filenames_written['new'].length + 1) + '-new.seq';
		filenames_written['new'].push(filename);
	    } else {
		filename = generateUpdatedFilename(result.merged);
		filenames_written.updated.push(filename);
	    }

	    try {
		fs.writeFileSync(path.join(directory, filename), result.data);
	    } catch (e) {
		console.error("Failed writing file '" + filename + "': " + e.message);
		return 1;
	    }
	    
	})) {
	    return -1;
	} else {
	    console.log((filenames_written['new'].length + filenames_written.updated.length) + ' files written');
	}

    }

}