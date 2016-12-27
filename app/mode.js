/* @flow */
'use strict';

class Mode {

    code       : string;
    displayName: string;

    constructor(code: string, displayName: string = code) {
        if (Mode.INSTANCES.has(code))
            throw new Error(`duplicate code value: [${code}]`);
        if (!Mode.canCreateMoreInstances)
            throw new Error(`attempt to call constructor(${code}`+
                            `, ${displayName}) after all static instances have been created`);
        this.code        = code;
        this.displayName = displayName;
        Object.freeze(this);
        Mode.INSTANCES.set(this.code, this);
    }

    toString() {
        return `[code: ${this.code}, displayName: ${this.displayName}]`;
    }
    static INSTANCES   = new Map();
    static canCreateMoreInstances      = true;

    // the values:
    static NORMAL    = new Mode('normal');
    static HELP      = new Mode('help');
    static values      = function() {
        return Array.from(Mode.INSTANCES.values());
    }

    next(): Mode {
        switch (this) {
        case Mode.NORMAL: return Mode.HELP;
        case Mode.HELP  : return Mode.NORMAL;
        default:
            throw new Error(`unhandled case ${this.code}`);
        }
    }

    static fromCode(code) {
        if (!Mode.INSTANCES.has(code))
            throw new Error(`unknown code: ${code}`);
        else
            return Mode.INSTANCES.get(code);
    }
}

Mode.canCreateMoreInstances = false;
Object.freeze(Mode);
exports.Mode = Mode;
