declare type FFourInts = (i: number, j: number, manhattan: number, step: number) => any;

declare type SpiralPathOptions = {
    fromManhattan : ?number;
    toManhattan   : ?number;
    maxSteps      : ?number;
    framed        : ?number;
};

declare type TFunctionManhattanPath = (s: ?SpiralPathOptions, f: FFourInts, i: number) => void;
