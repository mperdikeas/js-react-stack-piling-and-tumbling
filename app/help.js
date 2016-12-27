/* @flow */
require('./css/app.css');
const     _ = require('lodash');
const     $ = require('jquery');
const React = require('react');
var      cx = require('classnames');
var TimerMixin = require('react-timer-mixin');

import {List, fromJS} from 'immutable';
const assert     = require('chai').assert;
import {Geometry} from './geometry.js';
import {Mode}     from './mode.js';
import Cell       from './cell.js';




const Help = React.createClass({
    propTypes: {
        toggleHelp: React.PropTypes.func.isRequired
    },
    render: function() {
        return (
                <div style={helpCSS}>
                <p style={helpCSSParagraphFirst}>
                        Imagine a two-dimensional grid. Each cell (square) in the grid can hold a number of grains.
                        Initially the entire grid is empty. Then we start dropping grains in the center-most
                        square of the grid, one at a time.
                    </p>
                    <p style={helpCSSParagraph}>
                        However, once a square holds 4 or more grains, the stack becomes unstable and topples sending
                        1 grain to each of the adjacent four cells (but not diagonally) as shown below:
                    </p>
                    <img style={helpCSSImg} src='help-b.png'/>                    
                    <ol>
                        <li>The stack in the center holds 4 grains and has become unstable.</li>
                        <li>It's going to topple and send a grain to each of the four vertically or horizontally
(but not diagonally) adjacent cells</li>
                        <li>This is the situation after the stack in the middle toppled</li>
                        <li>As a result of the toppling, a new stack has now become unstable and it, too, is
                             going to topple &mdash; perhaps triggering further rounds of toppling.</li>
                    </ol>
                    <p style={helpCSSParagraph}>
                        &hellip; inevitably (?) at some point this process stops, the grid settles,
                        and we are ready to drop yet another grain in the center.
                    </p>
                    <div style={helpCSSButton}>
                        <input type='button' value='Cool &mdash; show me the action' onClick={this.props.toggleHelp}/>
                    </div>
                </div>
);}
});


const helpCSS = {
    position: 'absolute',
    top: '0',
    left: '0',
    fontSize: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '3px solid black',
    boxSizing: 'border-box',
    color: 'black',
    padding: '0.1em 0.1em',
    width: '100%',
    height: '100%',
    dbackgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.3))',
    backgroundSize: '270px 170px'
};

const helpCSSParagraph = {
    margin: '0.1em 0.4em'
};

// $SuppressFlowFinding: this is just to showcase the functionality
const helpCSSParagraphFirst = Object.assign(helpCSSParagraph, {marginTop: '1em'});

const helpCSSImg = {
    display: 'block',
    margin: '0 auto'
};

const helpCSSButton = {
    margin: '1em 0',
    textAlign: 'center'
};

export default Help;

