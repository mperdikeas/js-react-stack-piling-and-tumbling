 /* @flow */
'use strict';
const     _  = require('lodash');
import {assert} from 'chai';

declare type Function = () => any;

function isSetOf(setOfTs: any, T: Function): boolean {
    if (!(setOfTs instanceof Set)) return false;
    if (_.some(Array.from(setOfTs.entries())
               , ([x, _])=>!(x instanceof T)))
        return false;
    return true;
}
isSetOf.msg = (item, klass)=>`${item} is not a set of ${klass} values`;


function arr2set(ts: Array<any>): any {
    const rv = new Set(ts);
    const diff: number = ts.length - rv.size;
    assert.isTrue(diff>=0);
    if (diff !== 0)
        throw new Error(`at least ${diff} duplicate elements detected`);
    return rv;
}

function camelCase2Space(s: string): string {
    return s.replace(/([A-Z])/g, ' $1')                                 // insert a space before all caps
            .replace(/^./, function(str){ return str.toUpperCase(); }); // uppercase the first character
}

function nameOfClass(klass: Class<any>): string {
    console.log(klass.name);
    return klass.name;
}

function nameOfClassC2S(klass: Class<any>): string { // C2S stands for Camel 2 Space
    return camelCase2Space(nameOfClass(klass));
}


exports.isSetOf         = isSetOf;
exports.arr2set         = arr2set;
exports.camelCase2Space = camelCase2Space;
exports.nameOfClass     = nameOfClass;
exports.nameOfClassC2S  = nameOfClassC2S;

