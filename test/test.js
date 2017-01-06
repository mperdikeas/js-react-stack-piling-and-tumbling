/* @flow */
require('source-map-support').install();
import 'babel-polyfill';
const assert     = require('chai').assert;
import _ from 'lodash';
import {List, fromJS} from 'immutable';

describe('generic exploratory', function () {
    describe('yield', function() {
        it ('should work', function() {
            function* upTo(n: number, slow: boolean = false) {
                if (slow)
                    for (let i = 0 ; i < n ; i++)
                        yield i;
                else
                    yield n;
            }
            {
                const it = upTo(10, true);
                for (let v of it)
                    console.log(v);
            }
            console.log('========');
            {
                const it = upTo(10, false);
                for (let v of it)
                    console.log(v);
            }
        });
    });
    if (false) // TODO
    describe('chai', function() {
        describe('isString', function() {
            it('works with both primitives and String', function() {
                assert.isString('s');
                assert.isString(new String('foo'));
            });
        });
        describe('isBoolean', function() {
            it('works with both primitives and Boolean', function() {
                assert.isBoolean(true);
                assert.isBoolean(new Boolean(false));
            });
        });
        describe('isNumber', function() {
            it('works with both primitives and Number and infinities too', function() {
                assert.isNumber(3);
                assert.isNumber(Math.PI);
                assert.isNumber(new Number(3));
                assert.isNumber(Infinity);
                assert.isNumber(-Infinity);
            });
        });
        describe('how immutable works', function() {
            it('1d array', function() {
                var list1 = fromJS([1,2,3]);
                var list2 = list1.push(4);
                assert.strictEqual(JSON.stringify(list1.toJS()), JSON.stringify([1,2,3]));
                assert.strictEqual(JSON.stringify(list2.toJS()), JSON.stringify([1,2,3,4]));
            });
            it('2d array', function() {
                const arr = [[1,2,3], [2,4,6], [3,6,9]];
                var list1 = fromJS([[1,2,3], [2,4,6], [3,6,9]]);
                var list2 = list1.setIn([0, 1], 42);
                assert.strictEqual(JSON.stringify(list1.toJS()), JSON.stringify(arr));
                assert.strictEqual(JSON.stringify(list2.toJS()), JSON.stringify([[1,42,3], [2,4,6], [3,6,9]]));
            });
        });
    });
});
