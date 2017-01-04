/* @flow */
const     _ = require('lodash');
const     $ = require('jquery');
import React    from 'react';
import ReactDOM from 'react-dom';
import App      from './app.js';
import {Geometry} from './geometry.js';

$(document).ready(doStuff);


function doStuff(): void {

    ReactDOM.render(<App geometry={new Geometry(10, 25)}/>, $('#app')[0]);

}
