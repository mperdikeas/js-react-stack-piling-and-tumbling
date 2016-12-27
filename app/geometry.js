/* @flow */
'use strict';
const     _ = require('lodash');

import assert from 'assert';

class Geometry {
    manhattan: number;
    cellSize: number;

    gridSize(): number {
        return this.manhattan*2+1;
    }

    gridSizePx(): number {
        return this.gridSize()*this.cellSize;
    }
    
    constructor(manhattan: number, cellSize: number) {
        this.manhattan = manhattan;
        this.cellSize  = cellSize;
    }

};

exports.Geometry = Geometry;



