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
import Help       from './help.js';

function zero2D(rows, cols) {
    var array = [], row = [];
    while (cols--) row.push(0);
    while (rows--) array.push(row.slice());
    return array;
}

type StateT = {|
    mode: Mode,
    geometry: Geometry,
    grid: List<List<number>>,
    numOfGrains: number,
    spillage: number,
    droppingGrain: boolean,
    maxStacksToppled: ?number,
    maxChainDepth: ?number
|};


let grainDropTime = 0;



const App = React.createClass({
    mixins: [TimerMixin],
/*    propTypes: {
        msg: React.PropTypes.string.isRequired
        manhattan: React.PropTypes.number.isRequired
    },
*/
    getInitialState: function(): StateT {
        const manhattan = 10;
        const geometry = new Geometry(manhattan, 25);
        return {      mode            : Mode.NORMAL
                    , geometry        : geometry // TODO: geometry should not be part of the state
                    , grid            : fromJS(zero2D(geometry.gridSize(), geometry.gridSize()))
                    , numOfGrains: 0
                    , spillage        : 0 // TODO: place grid, numOfGrains, spillage, maxStackToppled and maxChainDepth (but NOT droppingGrain) in a kind of historical state object to allow me to go back in time.
                    , droppingGrain   : false
                    , maxStacksToppled: null
                    , maxChainDepth   : null
               };
    }
    , grainDropping: function() {
        if (this.state.droppingGrain) {
            this.dropGrain();
            this.setTimeout(this.grainDropping, 0);
        }
    }
    , createCells: function() {
        const cells = [];
        for (let i = 0 ; i < this.state.geometry.gridSize(); i++)
            for (let j = 0; j < this.state.geometry.gridSize(); j++) {
                const key = JSON.stringify({i: i, j: j});
                cells.push(
                        <Cell key   = {key}
                              i     = {i}
                              j     = {j}
                              size  = {this.state.geometry.cellSize}
                              value = {this.state.grid.getIn([i, j])}
                        >
                        </Cell>
                );
            }
        return cells;
    }
    , dropGrain() { // TODO: to dig whether and how I can use slow motion to see the individual tumbling effects (perhaps I can use yield to achieve the "one tiny step at a time" effect)
        const pathToCenterOfGrid = [this.state.geometry.manhattan, this.state.geometry.manhattan];
        const gridWithExtraGrainInCenter = this.state.grid.updateIn(pathToCenterOfGrid, (x)=>x+1);
        const gridAfterAllTumblingIsResolved = this.tumbling(gridWithExtraGrainInCenter);
        this.setState({grid: gridAfterAllTumblingIsResolved, numOfGrains: this.state.numOfGrains+1});
    }
    , toggleContinuousGrainDrop() {
        this.setState({droppingGrain: !this.state.droppingGrain}, ()=>{
            if (this.state.droppingGrain)
                this.grainDropping();
        });
    }
    , tumbling(grid: List<List<number>>): List<List<number>> {
        let stacksToppled  = 0;
        let spillage       = 0;
        type InnerTumblingT = {grid: any, maxDepth: number};        
        const _checkForTumblingAt = (grid: List<List<number>>, i: number, j: number) => {        
            if ((i<0)||(i>=this.state.geometry.gridSize()))
                return {grid: grid, maxDepth:0};
            if ((j<0)||(j>=this.state.geometry.gridSize()))
                return {grid: grid, maxDepth: 0};
            const _value : ?number = grid.getIn([i, j]);
            let subOrdinateMaxDepth;
            if (_value != null) {
                const value: number = _value;
                if (value>=4) {
                    const x: {grid: any; spillage: number} = this.tumbleAt(grid, i, j);
                    grid = x.grid;
                    spillage += x.spillage;
                    stacksToppled++;
                    const tumblingNorth: InnerTumblingT = _checkForTumblingAt(              grid, i  , j-1);
                    const tumblingEast : InnerTumblingT = _checkForTumblingAt(tumblingNorth.grid, i+1, j  );
                    const tumblingSouth: InnerTumblingT = _checkForTumblingAt(tumblingEast .grid, i  , j+1);
                    const tumblingWest : InnerTumblingT = _checkForTumblingAt(tumblingSouth.grid, i-1, j  );
                    subOrdinateMaxDepth = Math.max(tumblingNorth.maxDepth, tumblingEast.maxDepth, tumblingSouth.maxDepth, tumblingWest.maxDepth);
                    return {grid: tumblingWest.grid, maxDepth: 1+subOrdinateMaxDepth};
                } else
                    return {grid: grid, maxDepth: 0};                
            } else throw new Error('bug');
        };
        const recursiveTumbling: InnerTumblingT = _checkForTumblingAt(grid, this.state.geometry.manhattan, this.state.geometry.manhattan);
        let newMaxStacksToppled = null;
        if (this.state.maxStacksToppled != null)
            newMaxStacksToppled = stacksToppled > this.state.maxStacksToppled? {maxStacksToppled: stacksToppled} : {};
        else
            newMaxStacksToppled = {maxStacksToppled: stacksToppled};
        let newMaxChainDepth = null;
        if (this.state.maxChainDepth != null)
            newMaxChainDepth = recursiveTumbling.maxDepth > this.state.maxChainDepth? {maxChainDepth: recursiveTumbling.maxDepth} : {};
        else
            newMaxChainDepth = {maxChainDepth: recursiveTumbling.maxDepth};

        const newState = Object.assign({}
                                       , newMaxStacksToppled
                                       , newMaxChainDepth
                                       , {spillage: this.state.spillage+spillage});
        this.setState(newState);
        return recursiveTumbling.grid;
    }
    , tumbleAt(grid: any, i: number, j: number): {grid: any; spillage: number} {
        // curiously if you set this to 0 (zero) the summetry breaks at some point (I think I get why), but this also shows
        // that due to the recursive nature of the calls, at some point some stacks exceed the height of 4 (TODO: maybe monitor that as well)
        grid = grid.updateIn([i,j], (x)=>x-4);
        let spillage = 0;
        const inc = (x)=>x+1;
        if (j-1>=0)                             grid = grid.updateIn([i  , j-1], inc); else spillage++;
        if (i+1<this.state.geometry.gridSize()) grid = grid.updateIn([i+1, j  ], inc); else spillage++;
        if (j+1<this.state.geometry.gridSize()) grid = grid.updateIn([i  , j+1], inc); else spillage++;
        if (i-1>=0)                             grid = grid.updateIn([i-1, j  ], inc); else spillage++;
        return {grid: grid, spillage: spillage};
    }
    , toggleHelp: function() {
        this.setState({mode: this.state.mode.next()});
    }
    , render: function() {
        const appOuterDiv = {margin      : '1em'
                             , border    : '0'
                             , width     : `${this.state.geometry.gridSizePx()}px`
                             , position  : 'relative'
                            };
        const gridStyle = {width     : `${this.state.geometry.gridSizePx()}px`,
                           height    : `${this.state.geometry.gridSizePx()}px`,
                           margin    : '1rem 0 1rem 0',
                           background: 'red',
                           padding: 0,
                           fontSize: 0};

        const cells = this.createCells();
        const continuousButtonText = this.state.droppingGrain?"stop dropping grain":"start dropping grain";
        const REPORT_STATISTICS = false;
        const topplingStats = REPORT_STATISTICS?
                  (
                  this.state.maxStacksToppled!=null?
                   (<div>
                       <div>
                           maximum number of stacks toppled: {this.state.maxStacksToppled}
                       </div>
                       <div>
                           maximum chain length: {this.state.maxChainDepth}
                       </div>
                   </div>
                   ):null)
                  :null;
        const help = (()=>{
            if (this.state.mode===Mode.HELP)
                return (<Help toggleHelp={this.toggleHelp}/>)
            else
                return null;
        })();
        return (
            <div style={appOuterDiv}>
                <div>Grains piling and tumbling on a <tt>{this.state.geometry.gridSize()}</tt>&times;<tt>{this.state.geometry.gridSize()}</tt> grid
                &mdash;&nbsp;<a onClick={this.toggleHelp} style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}}>help</a></div>

    
                <div style={gridStyle}>
                    {cells}
                </div>
                <div><strong>{this.state.numOfGrains}</strong> grains dropped,
                    &nbsp;<strong>{this.state.spillage}</strong> grains spilled off the grid
                </div>
                <div style={{marginTop: '1em'}}>
                    <button onClick={this.dropGrain} disabled={this.state.droppingGrain}>drop single grain</button>
                    <button style={{marginLeft: '1em'}} onClick={this.toggleContinuousGrainDrop}>{continuousButtonText}</button>
                </div>
                {topplingStats}
                {help}
            </div>
        );
    }


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

const buttonLink = {
     background:'none!important',
     border:'none',
     padding:'0!important',
     font: 'inherit',
     cursor:'pointer',
     color: 'blue'
};


const helpCSSParagraph = {
    margin: '0.1em 0.4em'
};

const helpCSSImg = {
    display: 'block',
    margin: '0 auto'
};

const helpCSSButton = {
    margin: '1em 0',
    textAlign: 'center'
};

// $SuppressFlowFinding: this is just to showcase the functionality
const a : number = 'anything but';


export default App;

