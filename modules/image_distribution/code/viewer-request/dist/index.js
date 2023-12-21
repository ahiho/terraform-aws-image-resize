"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const querystring_1 = __importDefault(require("querystring"));
const constant_1 = require("./constant");
const getTransform = (key) => {
    if (key === 'f' || key === 'fit')
        return constant_1.Transform.Fit;
    return constant_1.DefaultValues.defaults.transform;
};
const getQuality = (key) => {
    if (key === 'l' || key === 'low')
        return constant_1.Quality.Low;
    if (key === 'm' || key === 'med' || key === 'medium')
        return constant_1.Quality.Medium;
    if (key === 'h' || key === 'high')
        return constant_1.Quality.High;
    if (key === 'b' || key === 'best')
        return constant_1.Quality.Best;
    return constant_1.DefaultValues.defaults.quality;
};
const getResizeMode = (width, height, transform) => {
    if (width && height) {
        if (transform === constant_1.Transform.Crop)
            return constant_1.ResizeMode.Crop;
        return constant_1.ResizeMode.Fit;
    }
    else if (width) {
        return constant_1.ResizeMode.Width;
    }
    else if (height) {
        return constant_1.ResizeMode.Height;
    }
    return constant_1.ResizeMode.Crop;
};
const roundAndLimit = (value, lowLimit, highLimit, roundingValue) => {
    const result = Math.round(value / roundingValue) * roundingValue;
    if (result < lowLimit)
        return lowLimit;
    if (result > highLimit)
        return highLimit;
    return result;
};
exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    const params = querystring_1.default.parse(request.querystring);
    const requestUrl = request.uri;
    const isRequestOriginalSource = params.original === 'true' || params.o === 'true';
    if (isRequestOriginalSource) {
        return callback(null, request);
    }
    const requestWidth = parseInt(params.width || params.w) || undefined;
    const requestHeight = parseInt(params.height || params.h) || undefined;
    const requestTransfrom = getTransform(params.transform || params.t);
    const requestQuality = getQuality(params.quality || params.q);
    const resizeMode = getResizeMode(requestWidth, requestHeight, requestTransfrom);
    const urlStructure = requestUrl.match(/(.*)\/(.*)\.(.*)/) || requestUrl.match(/(.*)\.(.*)/);
    // If don't have file extension, return original request
    if (!urlStructure) {
        return callback(null, request);
    }
    const hasPrefix = urlStructure.length > 3;
    const prefix = urlStructure[1];
    const imageName = hasPrefix ? urlStructure[2] : urlStructure[1];
    const extension = hasPrefix ? urlStructure[3] : urlStructure[2];
    // read the accept header to determine if webP is supported.
    const accept = headers['accept'] ? headers['accept'][0].value : '';
    const newUrlStructure = hasPrefix ? [prefix, resizeMode] : [resizeMode];
    const resizeWidth = roundAndLimit(requestWidth || constant_1.DefaultValues.width.default, constant_1.DefaultValues.width.min, constant_1.DefaultValues.width.max, constant_1.DefaultValues.roundToNearest);
    const resizeHeight = roundAndLimit(requestHeight || constant_1.DefaultValues.height.default, constant_1.DefaultValues.height.min, constant_1.DefaultValues.height.max, constant_1.DefaultValues.roundToNearest);
    if (resizeMode === constant_1.ResizeMode.Width) {
        newUrlStructure.push(`${resizeWidth}`);
    }
    else if (resizeMode === constant_1.ResizeMode.Height) {
        newUrlStructure.push(`${resizeHeight}`);
    }
    else {
        newUrlStructure.push(`${resizeWidth}x${resizeHeight}`);
    }
    newUrlStructure.push(requestQuality.toString());
    if (accept.includes(constant_1.DefaultValues.webpExtension)) {
        newUrlStructure.push(constant_1.DefaultValues.webpExtension);
    }
    else {
        newUrlStructure.push(`${extension}`);
    }
    newUrlStructure.push(`${imageName}.${extension}`);
    request.uri = newUrlStructure.join('/');
    return callback(null, request);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EsOERBQXNDO0FBQ3RDLHlDQUF3RjtBQUV4RixNQUFNLFlBQVksR0FBRyxDQUFDLEdBQXVCLEVBQUUsRUFBRTtJQUMvQyxJQUFJLEdBQUcsS0FBSyxHQUFHLElBQUksR0FBRyxLQUFLLEtBQUs7UUFBRSxPQUFPLG9CQUFTLENBQUMsR0FBRyxDQUFDO0lBQ3ZELE9BQU8sd0JBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO0FBQ3RDLENBQUMsQ0FBQztBQUVGLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBdUIsRUFBRSxFQUFFO0lBQzdDLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssS0FBSztRQUFFLE9BQU8sa0JBQU8sQ0FBQyxHQUFHLENBQUM7SUFDckQsSUFBSSxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsS0FBSyxLQUFLLElBQUksR0FBRyxLQUFLLFFBQVE7UUFBRSxPQUFPLGtCQUFPLENBQUMsTUFBTSxDQUFDO0lBQzVFLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssTUFBTTtRQUFFLE9BQU8sa0JBQU8sQ0FBQyxJQUFJLENBQUM7SUFDdkQsSUFBSSxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsS0FBSyxNQUFNO1FBQUUsT0FBTyxrQkFBTyxDQUFDLElBQUksQ0FBQztJQUN2RCxPQUFPLHdCQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztBQUNwQyxDQUFDLENBQUM7QUFFRixNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQWMsRUFBRSxNQUFlLEVBQUUsU0FBcUIsRUFBRSxFQUFFO0lBQy9FLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRTtRQUNuQixJQUFJLFNBQVMsS0FBSyxvQkFBUyxDQUFDLElBQUk7WUFBRSxPQUFPLHFCQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3pELE9BQU8scUJBQVUsQ0FBQyxHQUFHLENBQUM7S0FDdkI7U0FBTSxJQUFJLEtBQUssRUFBRTtRQUNoQixPQUFPLHFCQUFVLENBQUMsS0FBSyxDQUFDO0tBQ3pCO1NBQU0sSUFBSSxNQUFNLEVBQUU7UUFDakIsT0FBTyxxQkFBVSxDQUFDLE1BQU0sQ0FBQztLQUMxQjtJQUNELE9BQU8scUJBQVUsQ0FBQyxJQUFJLENBQUM7QUFDekIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFhLEVBQUUsUUFBZ0IsRUFBRSxTQUFpQixFQUFFLGFBQXFCLEVBQUUsRUFBRTtJQUNsRyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsR0FBRyxhQUFhLENBQUM7SUFFakUsSUFBSSxNQUFNLEdBQUcsUUFBUTtRQUFFLE9BQU8sUUFBUSxDQUFDO0lBQ3ZDLElBQUksTUFBTSxHQUFHLFNBQVM7UUFBRSxPQUFPLFNBQVMsQ0FBQztJQUV6QyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUM7QUFHVyxRQUFBLE9BQU8sR0FBRyxDQUFDLEtBQTZCLEVBQUUsT0FBZ0IsRUFBRSxRQUFrQixFQUFFLEVBQUU7SUFDN0YsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO0lBQzVDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFFaEMsTUFBTSxNQUFNLEdBQUcscUJBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBRXRELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFFL0IsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLENBQUMsUUFBUSxLQUFLLE1BQU0sSUFBSSxNQUFNLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQztJQUVsRixJQUFJLHVCQUF1QixFQUFFO1FBQzNCLE9BQU8sUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNoQztJQUVELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBRSxNQUFNLENBQUMsS0FBZ0IsSUFBSyxNQUFNLENBQUMsQ0FBWSxDQUFDLElBQUksU0FBUyxDQUFDO0lBRTdGLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBRSxNQUFNLENBQUMsTUFBaUIsSUFBSyxNQUFNLENBQUMsQ0FBWSxDQUFDLElBQUksU0FBUyxDQUFDO0lBRS9GLE1BQU0sZ0JBQWdCLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXBFLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU5RCxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBRWhGLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRTVGLHdEQUF3RDtJQUN4RCxJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ2pCLE9BQU8sUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNoQztJQUVELE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRTFDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUvQixNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWhFLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFaEUsNERBQTREO0lBQzVELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBRW5FLE1BQU0sZUFBZSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFeEUsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUMvQixZQUFZLElBQUksd0JBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUN2Qyx3QkFBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQ25CLHdCQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFDbkIsd0JBQVMsQ0FBQyxjQUFjLENBQ3pCLENBQUM7SUFDRixNQUFNLFlBQVksR0FBRyxhQUFhLENBQ2hDLGFBQWEsSUFBSSx3QkFBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQ3pDLHdCQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFDcEIsd0JBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUNwQix3QkFBUyxDQUFDLGNBQWMsQ0FDekIsQ0FBQztJQUVGLElBQUksVUFBVSxLQUFLLHFCQUFVLENBQUMsS0FBSyxFQUFFO1FBQ25DLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0tBQ3hDO1NBQU0sSUFBSSxVQUFVLEtBQUsscUJBQVUsQ0FBQyxNQUFNLEVBQUU7UUFDM0MsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVksRUFBRSxDQUFDLENBQUM7S0FDekM7U0FBTTtRQUNMLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxXQUFXLElBQUksWUFBWSxFQUFFLENBQUMsQ0FBQztLQUN4RDtJQUVELGVBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFFaEQsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLHdCQUFTLENBQUMsYUFBYSxDQUFDLEVBQUU7UUFDNUMsZUFBZSxDQUFDLElBQUksQ0FBQyx3QkFBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQy9DO1NBQU07UUFDTCxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsQ0FBQztLQUN0QztJQUVELGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLElBQUksU0FBUyxFQUFFLENBQUMsQ0FBQztJQUVsRCxPQUFPLENBQUMsR0FBRyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFeEMsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyJ9