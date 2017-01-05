/* @flow */
require('./css/app.css');
const     _ = require('lodash');
const     $ = require('jquery');
const React = require('react');
var      cx = require('classnames');
var TimerMixin = require('react-timer-mixin');

import {List, fromJS} from 'immutable';
const assert     = require('chai').assert;
import {FixedSizeLifo} from 'fixed-size-lifo';

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
    history: FixedSizeLifo,
    timeDelta: number,               // how back in time we are
    droppingGrain: boolean
|};

type HistoricalStateT = {|
    grid: List<List<number>>,
    numOfGrains: number,
    spillage: number,
    maxStacksToppled: ?number,
    maxChainDepth: ?number
|};


type TumblingResultT = {|
                        grid         : List<List<number>>,
                        depthReached : number,
                        stacksToppled: number,
                        spillage     : number
                        |};

let grainDropTime = 0;


const MAX_HISTORY = 10;

const App = React.createClass({
    mixins: [TimerMixin],
    propTypes: {
        geometry: React.PropTypes.object.isRequired
    },

    getInitialState: function(): StateT {
        const grid     = fromJS(zero2D(this.props.geometry.gridSize(), this.props.geometry.gridSize()));
        const history = new FixedSizeLifo(MAX_HISTORY); // TODO: think how we can enforce type safety in FixedSizeLifo
        const initialHistoryState: HistoricalStateT = {grid: grid, numOfGrains: 0, spillage: 0, maxStacksToppled: 0, maxChainDepth: 0};
        history.push(initialHistoryState);
        return {      mode              : Mode.NORMAL
                      , history         : history
                      , timeDelta       : 0 // TODO: rename to 'backInTime'
                      , droppingGrain   : false
               };
    }
    , grainDropping: function() {
        if (this.state.droppingGrain) {
            this.dropGrain();
            this.setTimeout(this.grainDropping, 0);
        }
    }
    , createCells: function(grid: any) {
        const cells = [];
        for (let i = 0 ; i < this.props.geometry.gridSize(); i++)
            for (let j = 0; j < this.props.geometry.gridSize(); j++) {
                const key = JSON.stringify({i: i, j: j});
                cells.push(
                        <Cell key   = {key}
                              i     = {i}
                              j     = {j}
                              size  = {this.props.geometry.cellSize}
                              value = {grid.getIn([i, j])}
                        >
                        </Cell>
                );
            }
        return cells;
    }
    , dropGrain() { 
        const pathToCenterOfGrid = [this.props.geometry.manhattan, this.props.geometry.manhattan];
        const gridWithExtraGrainInCenter = this.state.history.peek().grid.updateIn(pathToCenterOfGrid, (x)=>x+1);
        const tumblingResult: TumblingResultT = this.tumbling(gridWithExtraGrainInCenter);

        const maxStacksToppled = (()=>{
            if ((this.state.history.peek().maxStacksToppled==null) || (tumblingResult.stacksToppled > this.state.history.peek().maxStacksToppled))
                return tumblingResult.stacksToppled;
        })();


        const maxChainDepth = (()=>{
            if ((this.state.history.peek().maxChainDepth==null) || (tumblingResult.depthReached > this.state.history.peek().maxChainDepth))
                return tumblingResult.depthReached;
        })();

            
        const historyClone = this.state.history.clone();
        historyClone.push({grid               : tumblingResult.grid
                           , numOfGrains      : this.state.history.peek().numOfGrains+1
                           , spillage         : this.state.history.peek().spillage+tumblingResult.spillage
                           , maxStacksToppled : maxStacksToppled
                           , maxChainDepth    : maxChainDepth});
        
        this.setState({history: historyClone});
    }
    , rewindHistory() {
        const timeDelta = Math.min(MAX_HISTORY, this.state.history.size()-1);
        console.log(`setting timeDelta to ${timeDelta}`);
        this.setState({timeDelta: timeDelta});

    }
    , deltaOneFrame(delta: number) {
        assert.isTrue( (delta===1) || (delta===-1) );
        const newDelta: number = this.state.timeDelta+delta;
        console.log(`new delta is: ${newDelta}`);
        const idx: number = this.state.history.size()-1-newDelta;
        console.log(`history has size: ${this.state.history.size()}, examining at: ${idx}`);
        const historicalState: HistoricalStateT = this.state.history.at(idx);
        this.setState({timeDelta: newDelta});
    }
    , backOneFrame() {this.deltaOneFrame(+1);}
    , frwdOneFrame() {this.deltaOneFrame(-1);}
    , backToThePresent() {
        this.setState({timeDelta: 0});
    }    
    , toggleContinuousGrainDrop() {
        this.setState({droppingGrain: !this.state.droppingGrain}, ()=>{
            if (this.state.droppingGrain)
                this.grainDropping();
        });
    }
    , tumbling(grid: List<List<number>>): TumblingResultT {
        let stacksToppled  = 0;
        let spillage       = 0;
        type InnerTumblingT = {grid: any, maxDepth: number};        
        const checkForTumblingAt = (grid: List<List<number>>, i: number, j: number) => {        
            if ((i<0)||(i>=this.props.geometry.gridSize()))
                return {grid: grid, maxDepth:0};
            if ((j<0)||(j>=this.props.geometry.gridSize()))
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
                    const tumblingNorth: InnerTumblingT = checkForTumblingAt(              grid, i  , j-1);
                    const tumblingEast : InnerTumblingT = checkForTumblingAt(tumblingNorth.grid, i+1, j  );
                    const tumblingSouth: InnerTumblingT = checkForTumblingAt(tumblingEast .grid, i  , j+1);
                    const tumblingWest : InnerTumblingT = checkForTumblingAt(tumblingSouth.grid, i-1, j  );
                    subOrdinateMaxDepth = Math.max(tumblingNorth.maxDepth, tumblingEast.maxDepth, tumblingSouth.maxDepth, tumblingWest.maxDepth);
                    return {grid: tumblingWest.grid, maxDepth: 1+subOrdinateMaxDepth};
                } else
                    return {grid: grid, maxDepth: 0};                
            } else throw new Error('bug');
        };
        const recursiveTumbling: InnerTumblingT = checkForTumblingAt(grid, this.props.geometry.manhattan, this.props.geometry.manhattan);
        /*
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
*/
        return {grid           : recursiveTumbling.grid
                , depthReached : recursiveTumbling.maxDepth
                , stacksToppled: stacksToppled
                , spillage     : spillage};
    }
    , tumbleAt(grid: any, i: number, j: number): {grid: any; spillage: number} {
        // curiously if you set this to 0 (zero) the summetry breaks at some point (I think I get why), but this also shows
        // that due to the recursive nature of the calls, at some point some stacks exceed the height of 4 (TODO: maybe monitor that as well)
        grid = grid.updateIn([i,j], (x)=>x-4);
        let spillage = 0;
        const inc = (x)=>x+1;
        if (j-1>=0)                             grid = grid.updateIn([i  , j-1], inc); else spillage++;
        if (i+1<this.props.geometry.gridSize()) grid = grid.updateIn([i+1, j  ], inc); else spillage++;
        if (j+1<this.props.geometry.gridSize()) grid = grid.updateIn([i  , j+1], inc); else spillage++;
        if (i-1>=0)                             grid = grid.updateIn([i-1, j  ], inc); else spillage++;
        return {grid: grid, spillage: spillage};
    }
    , toggleHelp: function() {
        this.setState({mode: this.state.mode.next()});
    }
    , render: function() {
        const appOuterDiv = {margin      : '1em'
                             , border    : '0'
                             , width     : `${this.props.geometry.gridSizePx()}px`
                             , position  : 'relative'
                            };
        const gridStyle = {width     : `${this.props.geometry.gridSizePx()}px`,
                           height    : `${this.props.geometry.gridSizePx()}px`,
                           margin    : '1rem 0 1rem 0',
                           background: 'red',
                           padding: 0,
                           fontSize: 0};

        const historicalState : HistoricalStateT = this.state.history.at(this.state.history.size()-1-this.state.timeDelta); // TODO: use the updated lifo peek that takes a numeric argument
        const cells = this.createCells(historicalState.grid);
        const continuousButtonText = this.state.droppingGrain?"stop dropping grain":"start dropping grain";
        const REPORT_STATISTICS = false;
        const topplingStats = REPORT_STATISTICS?
                  (
                  historicalState.maxStacksToppled!=null?
                   (<div>
                       <div>
                           maximum number of stacks toppled: {historicalState.maxStacksToppled}
                       </div>
                       <div>
                           maximum chain length: {historicalState.maxChainDepth}
                       </div>
                   </div>
                   ):null)
                  :null;
        const help = (()=>{
            if (this.state.mode===Mode.HELP)
                return (<Help toggleHelp={this.toggleHelp}/>);
            else
                return null;
        })();
        return (
            <div style={appOuterDiv}>
                <div>Grains piling and tumbling on a <tt>{this.props.geometry.gridSize()}</tt>&times;<tt>{this.props.geometry.gridSize()}</tt> grid
                &mdash;&nbsp;<a onClick={this.toggleHelp} style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}}>help</a></div>

    
                <div style={gridStyle}>
                    {cells}
                </div>
                <div><strong>{historicalState.numOfGrains}</strong> grains dropped,
                &nbsp;<strong>{historicalState.spillage}</strong> grains spilled off the grid
                &nbsp;<strong>{this.state.history.size()}</strong> history size TODO remove that
                </div>
                <div style={{marginTop: '1em'}}>
                <button                             disabled={(this.state.timeDelta!==0) || this.state.droppingGrain} onClick={this.dropGrain}                >drop single grain</button>
                <button style={{marginLeft: '1em'}} disabled={ this.state.timeDelta!==0}                              onClick={this.toggleContinuousGrainDrop}>{continuousButtonText}</button>
                </div>
                <div style={{marginTop: '1em'}}>
                <button onClick={this.rewindHistory}    disabled={(this.state.timeDelta===Math.min(MAX_HISTORY, this.state.history.size())-1) || this.state.droppingGrain}>
                    &lt;&lt;
                </button> 
                <button onClick={this.backOneFrame}    disabled={(this.state.timeDelta===Math.min(MAX_HISTORY, this.state.history.size())-1) || this.state.droppingGrain}>
                    &lt;
                </button>                 
                <button onClick={this.frwdOneFrame}     disabled={(this.state.timeDelta===0) || this.state.droppingGrain}>&gt;</button>                                
                <button onClick={this.backToThePresent} disabled={(this.state.timeDelta===0) || this.state.droppingGrain}>&gt;&gt;</button>

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

