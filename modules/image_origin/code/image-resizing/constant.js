"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultValues = exports.ResizeMode = exports.Quality = exports.Transform = void 0;
var Transform;
(function (Transform) {
    Transform[Transform["Fit"] = 0] = "Fit";
    Transform[Transform["Crop"] = 1] = "Crop";
})(Transform = exports.Transform || (exports.Transform = {}));
var Quality;
(function (Quality) {
    Quality["Low"] = "l";
    Quality["Medium"] = "m";
    Quality["High"] = "h";
    Quality["Best"] = "b";
})(Quality = exports.Quality || (exports.Quality = {}));
var ResizeMode;
(function (ResizeMode) {
    ResizeMode["Width"] = "w";
    ResizeMode["Height"] = "h";
    ResizeMode["Crop"] = "c";
    ResizeMode["Fit"] = "f";
})(ResizeMode = exports.ResizeMode || (exports.ResizeMode = {}));
exports.DefaultValues = {
    width: { min: 100, max: 4100, default: 640 },
    height: { min: 100, max: 4100, default: 400 },
    roundToNearest: 10,
    defaults: { quality: Quality.Medium, transform: Transform.Crop },
    webpExtension: 'webp',
};