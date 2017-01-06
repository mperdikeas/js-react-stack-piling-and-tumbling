/* @flow */
'use strict';
const     _  = require('lodash');
import {assert} from 'chai';
import {List} from 'immutable';

declare type Function = () => any;

declare type TFunctionNumberToBoolean = (n: number, foo: number) => boolean;

const f: TFunctionNumberToBoolean = function isEven(n: number) {return n%2==0;}

type TumblingResultT = {|
                        grid         : List<List<number>>,
                        depthReached : number,
                        stacksToppled: number,
                        spillage     : number
                        |};


function tumbling(grid: List<List<number>>, gridSize: number): TumblingResultT {
    assert.isTrue(Number.isInteger(gridSize));
    assert.isTrue(gridSize%2==1);
    const center: number = (gridSize - 1) / 2;
    let stacksToppled  = 0;
    let spillage       = 0;
    type InnerTumblingT = {grid: any, maxDepth: number};        
    const checkForTumblingAt = (grid: List<List<number>>, i: number, j: number) => {        
        if ((i<0)||(i>=gridSize))
            return {grid: grid, maxDepth:0};
        if ((j<0)||(j>=gridSize))
            return {grid: grid, maxDepth: 0};
        const _value : ?number = grid.getIn([i, j]);
        let subOrdinateMaxDepth;
        if (_value != null) {
            const value: number = _value;
            if (value>=4) {
                const x: {grid: any; spillage: number} = tumbleAt(grid, gridSize, i, j);
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
    const recursiveTumbling: InnerTumblingT = checkForTumblingAt(grid, center, center);
    return {grid           : recursiveTumbling.grid
            , depthReached : recursiveTumbling.maxDepth
            , stacksToppled: stacksToppled
            , spillage     : spillage};
}

function tumbleAt(grid: List<List<number>>, gridSize: number, i: number, j: number): {grid: any; spillage: number} {
    // curiously if you set the updated value to 0 (instead of x-4) the summetry breaks at some point (I think I get why), but this also shows
    // that due to the recursive nature of the calls, at some point some stacks exceed the height of 4 (TODO: maybe monitor that as well)
    grid = grid.updateIn([i,j], (x)=>x-4);
    let spillage = 0;
    const inc = (x)=>x+1;
    if (j-1>=0)       grid = grid.updateIn([i  , j-1], inc); else spillage++;
    if (i+1<gridSize) grid = grid.updateIn([i+1, j  ], inc); else spillage++;
    if (j+1<gridSize) grid = grid.updateIn([i  , j+1], inc); else spillage++;
    if (i-1>=0)       grid = grid.updateIn([i-1, j  ], inc); else spillage++;
    return {grid: grid, spillage: spillage};
}



exports.tumbling = tumbling;
export type {TumblingResultT};
