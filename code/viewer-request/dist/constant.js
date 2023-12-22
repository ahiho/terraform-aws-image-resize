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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29uc3RhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsSUFBWSxTQUdYO0FBSEQsV0FBWSxTQUFTO0lBQ25CLHVDQUFHLENBQUE7SUFDSCx5Q0FBSSxDQUFBO0FBQ04sQ0FBQyxFQUhXLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBR3BCO0FBRUQsSUFBWSxPQUtYO0FBTEQsV0FBWSxPQUFPO0lBQ2pCLG9CQUFTLENBQUE7SUFDVCx1QkFBWSxDQUFBO0lBQ1oscUJBQVUsQ0FBQTtJQUNWLHFCQUFVLENBQUE7QUFDWixDQUFDLEVBTFcsT0FBTyxHQUFQLGVBQU8sS0FBUCxlQUFPLFFBS2xCO0FBRUQsSUFBWSxVQUtYO0FBTEQsV0FBWSxVQUFVO0lBQ3BCLHlCQUFXLENBQUE7SUFDWCwwQkFBWSxDQUFBO0lBQ1osd0JBQVUsQ0FBQTtJQUNWLHVCQUFTLENBQUE7QUFDWCxDQUFDLEVBTFcsVUFBVSxHQUFWLGtCQUFVLEtBQVYsa0JBQVUsUUFLckI7QUFFWSxRQUFBLGFBQWEsR0FBRztJQUMzQixLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtJQUM1QyxNQUFNLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRTtJQUM3QyxjQUFjLEVBQUUsRUFBRTtJQUNsQixRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRTtJQUNoRSxhQUFhLEVBQUUsTUFBTTtDQUN0QixDQUFDIn0=