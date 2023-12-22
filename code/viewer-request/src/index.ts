import { Callback, CloudFrontRequestEvent, Context } from 'aws-lambda';
import querystring from 'querystring';
import { DefaultValues as variables, Transform, Quality, ResizeMode } from './constant';

const getTransform = (key?: string | string[]) => {
  if (key === 'f' || key === 'fit') return Transform.Fit;
  return variables.defaults.transform;
};

const getQuality = (key?: string | string[]) => {
  if (key === 'l' || key === 'low') return Quality.Low;
  if (key === 'm' || key === 'med' || key === 'medium') return Quality.Medium;
  if (key === 'h' || key === 'high') return Quality.High;
  if (key === 'b' || key === 'best') return Quality.Best;
  return variables.defaults.quality;
};

const getResizeMode = (width?: number, height?: number, transform?: Transform) => {
  if (width && height) {
    if (transform === Transform.Crop) return ResizeMode.Crop;
    return ResizeMode.Fit;
  } else if (width) {
    return ResizeMode.Width;
  } else if (height) {
    return ResizeMode.Height;
  }
  return ResizeMode.Crop;
};

const roundAndLimit = (value: number, lowLimit: number, highLimit: number, roundingValue: number) => {
  const result = Math.round(value / roundingValue) * roundingValue;

  if (result < lowLimit) return lowLimit;
  if (result > highLimit) return highLimit;

  return result;
};


export const handler = (event: CloudFrontRequestEvent, context: Context, callback: Callback) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const params = querystring.parse(request.querystring);

  const requestUrl = request.uri;

  const isRequestOriginalSource = params.original === 'true' || params.o === 'true';

  if (isRequestOriginalSource) {
    return callback(null, request);
  }

  const requestWidth = parseInt((params.width as string) || (params.w as string)) || undefined;

  const requestHeight = parseInt((params.height as string) || (params.h as string)) || undefined;

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

  const resizeWidth = roundAndLimit(
    requestWidth || variables.width.default,
    variables.width.min,
    variables.width.max,
    variables.roundToNearest
  );
  const resizeHeight = roundAndLimit(
    requestHeight || variables.height.default,
    variables.height.min,
    variables.height.max,
    variables.roundToNearest
  );

  if (resizeMode === ResizeMode.Width) {
    newUrlStructure.push(`${resizeWidth}`);
  } else if (resizeMode === ResizeMode.Height) {
    newUrlStructure.push(`${resizeHeight}`);
  } else {
    newUrlStructure.push(`${resizeWidth}x${resizeHeight}`);
  }

  newUrlStructure.push(requestQuality.toString());

  if (accept.includes(variables.webpExtension)) {
    newUrlStructure.push(variables.webpExtension);
  } else {
    newUrlStructure.push(extension);
  }

  newUrlStructure.push(`${imageName}.${extension}`);

  request.uri = newUrlStructure.join('/');

  return callback(null, request);
};
