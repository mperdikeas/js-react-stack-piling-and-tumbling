/* @flow */
'use strict';
const     _  = require('lodash');
import {assert} from 'chai';

declare type Function = () => any;

declare type TFunctionNumberToBoolean = (n: number, foo: number) => boolean;

const f: TFunctionNumberToBoolean = function isEven(n: number) {return n%2==0;}

function isOdd (n: number): boolean { return (n%2)!=0; } // where am I supposed to annotate this function as being of type TFunctionNumberToBoolean ??
const manhattanPath: TFunctionManhattanPath = function(spiralPathOptions: ?SpiralPathOptions, f: FFourInts) {
    function inBox(i: number, j: number): boolean {
        if (spiralPathOptions && spiralPathOptions.framed!=null) {
            const framed: number = spiralPathOptions.framed;
            return ((Math.abs(i)<=framed) && (Math.abs(j)<=framed));
        } else
            return true;
    }
    type Holder = {steps: number};
    let holder:Holder = {steps: 0};
    const fromManhattan: number = (spiralPathOptions && spiralPathOptions.fromManhattan) || 0;
    const   toManhattan: number = (spiralPathOptions && spiralPathOptions.toManhattan)   || 0;
    const      maxSteps: number = (spiralPathOptions && spiralPathOptions.maxSteps)      || Infinity;
    const MaxStepsReached = {};
    const fwrapper = (function (i: number, j: number, manhattan: number, holder: Holder) : any {
        if (holder.steps>=maxSteps)
            throw MaxStepsReached;
        else f(i , j, manhattan, holder.steps);
        holder.steps++;
    });
    try {
        for (let manhattan: number = fromManhattan;  manhattan<=toManhattan; manhattan++) {
            if (manhattan==0) {
                fwrapper(0, 0, manhattan, holder);
            } else {
                // north-west side of the manhattan rhombus
                for (let i = 0, j = -manhattan; i<manhattan; i++, j++) {
                    if (spiralPathOptions && spiralPathOptions.framed && !inBox(i, j))
                        continue;
                    else
                        fwrapper(i, j, manhattan, holder);
                }
                // south-west side
                for (let i = manhattan, j = 0; j<manhattan; i--, j++) {
                    if (spiralPathOptions && spiralPathOptions.framed && !inBox(i, j))
                        continue;
                    else
                        fwrapper(i, j, manhattan, holder);
                }
                // south-east side
                for (let i = 0, j = manhattan; i>-manhattan; i--, j--) {
                    if (spiralPathOptions && spiralPathOptions.framed && !inBox(i, j))
                        continue;
                    else
                        fwrapper(i, j, manhattan, holder);
                }
                // north-east side
                for (let i = -manhattan, j = 0; i<0 ; i++, j--) {
                    if (spiralPathOptions && spiralPathOptions.framed && !inBox(i, j))
                        continue;
                    else
                        fwrapper(i, j, manhattan, holder);
                }
            }
        }
    } catch (err) {
        console.log(err);
        if (err !== MaxStepsReached)
            throw err;
    }
}

exports.manhattanPath = manhattanPath;
