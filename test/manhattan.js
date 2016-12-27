/* @flow */
require('source-map-support').install();
import 'babel-polyfill';
const assert     = require('chai').assert;
import _ from 'lodash';

import {isSetOf, arr2set} from '../lib/util.js';

import {manhattanPath} from '../lib/manhattan.js';
console.log(`${(new Date()).toString()}`);

function f2accum(arr) {
    return function(i, j) {
        arr.push({i: i, j: j});
    };
}

describe('manhattanPath', function () {
    it('should work - case manhattan 0'
       , function () {
           const options: SpiralPathOptions = {fromManhattan: null, toManhattan: 0, maxSteps: null, framed: null};
           const arr = [];
           const expected = [{i: 0, j: 0}];
           manhattanPath(options, f2accum(arr));
           assert.isTrue(_.isEqual(arr, expected));
       });
    it('should work - case mahnattan 1'
       , function () {
           const options: SpiralPathOptions = {fromManhattan: null, toManhattan: 1, maxSteps: null, framed: null};
           const arr = [];
           const expected = [{i:0,j:0},{i:0,j:-1},{i:1,j:0},{i:0,j:1},{i:-1,j:0}];
           manhattanPath(options, f2accum(arr));
           assert.strictEqual(JSON.stringify(arr), JSON.stringify(expected));
       });
    it('should work - case mahnattan 2'
       , function () {
           const options: SpiralPathOptions = {fromManhattan: null, toManhattan: 2, maxSteps: null, framed: null};
           const arr = [];
           const expected = [{i:0,j:0},{i:0,j:-1},{i:1,j:0},{i:0,j:1},{i:-1,j:0},{i:0,j:-2},{i:1,j:-1},{i:2,j:0},{i:1,j:1},{i:0,j:2},{i:-1,j:1},{i:-2,j:0},{i:-1,j:-1}];
           manhattanPath(options, f2accum(arr));
           assert.strictEqual(JSON.stringify(arr), JSON.stringify(expected));
       });
    it('should work - case mahnattan 2 - framed 1'
       , function () {
           const options: SpiralPathOptions = {fromManhattan: null, toManhattan: 2, maxSteps: null, framed: 1};
           const arr = [];
           const expected = [{i:0,j:0},{i:0,j:-1},{i:1,j:0},{i:0,j:1},{i:-1,j:0},{i:1,j:-1},{i:1,j:1},{i:-1,j:1},{i:-1,j:-1}];
           manhattanPath(options, f2accum(arr));
           assert.strictEqual(JSON.stringify(arr), JSON.stringify(expected));
       });    
    it('should work - case mahnattan 1 to 2'
       , function () {
           const options: SpiralPathOptions = {fromManhattan: 1, toManhattan: 2, maxSteps: null, framed: null};
           const arr = [];
           const expected = [{i:0,j:-1},{i:1,j:0},{i:0,j:1},{i:-1,j:0},{i:0,j:-2},{i:1,j:-1},{i:2,j:0},{i:1,j:1},{i:0,j:2},{i:-1,j:1},{i:-2,j:0},{i:-1,j:-1}];
           manhattanPath(options, f2accum(arr));
           assert.strictEqual(JSON.stringify(arr), JSON.stringify(expected));
       });
    it('should work - case mahnattan 1 to 2, 3 steps only'
       , function () {
           const options: SpiralPathOptions = {fromManhattan: 1, toManhattan: 2, maxSteps: 3, framed: null};
           const arr = [];
           const expected = [{i:0,j:-1},{i:1,j:0},{i:0,j:1}];
           manhattanPath(options, f2accum(arr));
           assert.strictEqual(JSON.stringify(arr), JSON.stringify(expected));
       });                
});

