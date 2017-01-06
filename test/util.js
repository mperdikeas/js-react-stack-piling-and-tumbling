/* @flow */
require('source-map-support').install();
import 'babel-polyfill';
const assert     = require('chai').assert;
import _ from 'lodash';

import {isSetOf, arr2set} from '../lib/util.js';

if (false) // TODO
describe('isSetOf', function () {
    it('should work'
       , function () {
           const s: Set<any> = new Set();
           assert.isTrue(isSetOf(s), String);
       });

    it('arrays sup', function() {
        const a: Array<Array<number>> = [];
        a[-1] = [];
        a[-1][-3]=42;
        assert.strictEqual(a[-1][-3], 42);
    });
});

