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

import {Geometry}             from './geometry.js';
import {Mode}                 from './mode.js';
import Cell                   from './cell.js';
import Help                   from './help.js';
import {tumbling}             from './tumbling.js';
import type {TumblingResultT} from './tumbling.js';
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


let grainDropTime = 0;

const MAX_HISTORY = 1000;

const extraReactState = {
    rollingGrain: 0,    
    rollingForward: 0,
    rollingBackward: 0
}; // is this an abomination?



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
    /* 
     *   Machinery for continuously firing the 'dropGrain' button (not to be confused with the grainDropping method which opens a valve
     */    
    , dropGrainContinuous: function(observedRollingGrain: number) {
        function dropGrainContinuousInner() {
            if (extraReactState.rollingGrain===observedRollingGrain) {
                this.dropGrain();
                this.setTimeout(dropGrainContinuousInner, 0);
            }
        }
        return dropGrainContinuousInner.bind(this);
    }
    , dropGrainMD() {extraReactState.rollingGrain++; this.setTimeout(this.dropGrainContinuous(extraReactState.rollingGrain), 300)}
    , dropGrainMU() {extraReactState.rollingGrain++;}
    , dropGrain() {
        this.setState( (prevState, props) => {
            const pathToCenterOfGrid = [props.geometry.manhattan, props.geometry.manhattan];
            const gridWithExtraGrainInCenter = prevState.history.peek().grid.updateIn(pathToCenterOfGrid, (x)=>x+1);
            const tumblingResult: TumblingResultT = tumbling(gridWithExtraGrainInCenter, props.geometry.gridSize());

            const maxStacksToppled = (()=>{
                if ((prevState.history.peek().maxStacksToppled==null) || (tumblingResult.stacksToppled > prevState.history.peek().maxStacksToppled))
                    return tumblingResult.stacksToppled;
            })();


            const maxChainDepth = (()=>{
                if ((prevState.history.peek().maxChainDepth==null) || (tumblingResult.depthReached > prevState.history.peek().maxChainDepth))
                    return tumblingResult.depthReached;
            })();

            
            const historyClone = prevState.history.clone();
            historyClone.push({grid               : tumblingResult.grid
                               , numOfGrains      : prevState.history.peek().numOfGrains+1
                               , spillage         : prevState.history.peek().spillage+tumblingResult.spillage
                               , maxStacksToppled : maxStacksToppled
                               , maxChainDepth    : maxChainDepth});
            
            return {history: historyClone};
        });
    }

    , deltaOneFrame(delta: number) {
        assert.isTrue( (delta===1) || (delta===-1) );
        const newDelta: number = this.state.timeDelta+delta;
        const idx: number = this.state.history.size()-1-newDelta;
        const historicalState: HistoricalStateT = this.state.history.at(idx);
        this.setState({timeDelta: newDelta});
    }

    /* 
     *   Machinery for continuous backward motion in time
     */    
    , backwardOneFrameContinuous: function(observedRollingBackward: number) {
        function backwardOneFrameContinuousInner() {
            if ((extraReactState.rollingBackward===observedRollingBackward) && (this.state.timeDelta<this.state.history.maximumPeekFurtherBack())) {
                this.backOneFrame();
                this.setTimeout(backwardOneFrameContinuousInner, 0);
            }
        }
        return backwardOneFrameContinuousInner.bind(this);
    }
    , backOneFrame() {this.deltaOneFrame(+1);}
    , backOneFrameMD() {extraReactState.rollingBackward++; this.setTimeout(this.backwardOneFrameContinuous(extraReactState.rollingBackward), 300)}
    , backOneFrameMU() {extraReactState.rollingBackward++;}
    , rewindHistory() {
        const timeDelta = Math.min(MAX_HISTORY, this.state.history.size()-1);
        this.setState({timeDelta: timeDelta});
    }    

    /*
     *   Machinery for continuous forward motion in time
     */
    , forwardOneFrameContinuous: function(observedRollingForward: number) {
        function forwardOneFrameContinuousInner() {
            if ((extraReactState.rollingForward===observedRollingForward) && (this.state.timeDelta>0)) {
                this.frwdOneFrame();
                this.setTimeout(forwardOneFrameContinuousInner, 0);
            }
        }
        return forwardOneFrameContinuousInner.bind(this);
    }
    , frwdOneFrame() {this.deltaOneFrame(-1);}
    , frwdOneFrameMD() {extraReactState.rollingForward++; this.setTimeout(this.forwardOneFrameContinuous(extraReactState.rollingForward), 300)}
    , frwdOneFrameMU() {extraReactState.rollingForward++;}
    , backToThePresent() {
        this.setState({timeDelta: 0});
    }
    , toggleContinuousGrainDrop() {
        this.setState({droppingGrain: !this.state.droppingGrain}, ()=>{
            if (this.state.droppingGrain)
                this.grainDropping();
        });
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

        const historicalState : HistoricalStateT = this.state.history.peek(this.state.timeDelta);
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
        const glossStyle = {fontSize: '80%', fontStyle: 'italics', color: 'purple', marginTop: '1em'};
        const explanationForTimeTravel = (()=>{
            if (this.state.timeDelta!==0)
                return (
                    <div style={glossStyle}>you are now {this.state.timeDelta} frames into the past so the action buttons are <b>disabled</b></div>
                );
            else
                return (<div style={glossStyle}>&nbsp;</div>);
        })();

        const historyCommentary = (()=>{
            let lostMsg ;
            if (this.state.history.numOverflown()>0)
                lostMsg = ` (${this.state.history.numOverflown()} frames have been lost)`;
            else
                lostMsg = '';
            
            return (
                <div style={glossStyle}>history buffer holds the most recent {MAX_HISTORY} frames{lostMsg}</div>
            );
        })();
        return (
            <div style={appOuterDiv}>
                <div>Grains piling and tumbling on a <tt>{this.props.geometry.gridSize()}</tt>&times;<tt>{this.props.geometry.gridSize()}</tt> grid
                &mdash;&nbsp;<a onClick={this.toggleHelp} style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}}>what is this?</a></div>

    
                <div style={gridStyle}>
                    {cells}
                </div>
                <div><strong>{historicalState.numOfGrains}</strong> grains dropped,
                &nbsp;<strong>{historicalState.spillage}</strong> grains spilled off the grid
                </div>
                {explanationForTimeTravel}
                <div style={{marginTop: '0'}}>
                <button
            title='keep pressing for continuous dropping of grain'
            disabled={(this.state.timeDelta!==0) || this.state.droppingGrain}
            onClick={this.dropGrain}
            onMouseDown={this.dropGrainMD}
            onMouseUp  ={this.dropGrainMU}
                >drop single grain</button>
                <button style={{marginLeft: '1em'}}
            title='this is a toggle button that represents a grain valve in two states: opened/closed'
            disabled={ this.state.timeDelta!==0}
            onClick={this.toggleContinuousGrainDrop}>{continuousButtonText}</button>
                </div>
                <div style={{marginTop: '1em'}}>
                
                <button
            title='go back to the beginning of time (or the limits of our history buffer)'
            onClick={this.rewindHistory}
            disabled={(this.state.timeDelta===this.state.history.maximumPeekFurtherBack()) || this.state.droppingGrain}>
                    &lt;&lt;
            </button>
                
                <button title='one frame back in time; keep pressed for continuous firing'
            onClick    ={this.backOneFrame}
            onMouseDown={this.backOneFrameMD}
            onMouseUp  ={this.backOneFrameMU}
            disabled={(this.state.timeDelta===this.state.history.maximumPeekFurtherBack()) || this.state.droppingGrain}>
                    &lt;
            </button>
                
                <button
            title='one frame forward in time; keep pressed for continuous firing'
            onClick    ={this.frwdOneFrame}
            onMouseDown={this.frwdOneFrameMD}
            onMouseUp  ={this.frwdOneFrameMU}
            disabled={(this.state.timeDelta===0) || this.state.droppingGrain}>&gt;
            </button>
                
                <button
            title='back to the present'
            onClick={this.backToThePresent}
            disabled={(this.state.timeDelta===0) || this.state.droppingGrain}>&gt;&gt;</button>
                </div>
                {historyCommentary}
                {topplingStats}
                {help}
            </div>
        );
    }


});


// $SuppressFlowFinding: this is just to showcase the functionality
const a : number = 'anything but';


export default App;

