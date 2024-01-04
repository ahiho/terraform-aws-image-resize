import AwsSDK from "aws-sdk";
import { resize } from "./utils/resize.mjs";
import config from "./utils/config.mjs";
import { getQuality, getResizeMode, getTransform, limit, roundAndLimit } from "./utils/request.mjs";
import { DefaultValues as variables, WEBP_EXTENSION } from "./utils/constant.mjs";
import { log } from "./utils/log.mjs";

const { S3 } = AwsSDK;

/**
 * @param {Object} event - S3 Object Lambda Access Point event
 * @param {Object} context
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */
export const lambdaHandler = async (event, context) => {
  const { getObjectContext, userRequest } = event;

  const s3 = new S3({
    region: config.region,
  })

  const s3Url = getObjectContext.inputS3Url;
  const requestRoute = getObjectContext.outputRoute;
  const requestToken = getObjectContext.outputToken;

  const urlObject = new URL(userRequest.url);
  const searchParams = new URLSearchParams(urlObject.search);

  const isRequestOriginalSource =
    searchParams.get("original") === "true" || searchParams.get("o") === "true";

  if (isRequestOriginalSource) {
    log('return originalObject');
    try {
      const originalObject = await getObject(s3Url);
      log("originalObject", originalObject);
      await s3.writeGetObjectResponse({
        RequestRoute: requestRoute,
        RequestToken: requestToken,
        Body: originalObject,
      }).promise();

      return {
        statusCode: 200,
      }
    } catch (e) {
      return {
        statusCode: e.statusCode,
      }
    }
  }

  const userRequestPathname = urlObject.pathname.replace(/^\//, '');
  const urlStructure = userRequestPathname.match(/(.*)\/(.*)\.(.*)/) || userRequestPathname.match(/(.*)\.(.*)/);
  const hasPrefix = urlStructure.length > 3;
  const prefix = urlStructure[1];
  const imageName = hasPrefix ? urlStructure[2] : urlStructure[1];
  const extension = hasPrefix ? urlStructure[3] : urlStructure[2];
  const acceptHeader = userRequest.headers['accept']?.[0].value || '';

  const requestWidth = parseInt(searchParams.get("width")) || undefined;
  const requestHeight = parseInt(searchParams.get("height")) || undefined;
  const requestTransform = getTransform(searchParams.get("transform")) || undefined;
  const requestQuality = getQuality(searchParams.get("quality")) || undefined;
  const requestBlur = parseInt(searchParams.get("blur")) || undefined;

  const resizeMode = getResizeMode(
    requestWidth,
    requestHeight,
    requestTransform,
  );

  const resizeWidth = roundAndLimit(
    requestWidth || variables.width.default,
    variables.width.min,
    variables.width.max,
    config.roundingValue,
  );

  const resizeHeight = roundAndLimit(
    requestHeight || variables.height.default,
    variables.height.min,
    variables.height.max,
    config.roundingValue,
  );

  const resizeBlur = limit(requestBlur, 0, 50)

  const imageProcessParams = {
    w: resizeWidth,
    h: resizeHeight,
    m: resizeMode,
    q: requestQuality,
    b: resizeBlur,
  }
  log('imageProcessParams', imageProcessParams)

  const imageProcessParamsEncoded = Buffer.from(JSON.stringify(imageProcessParams)).toString('base64url');

  const resizeObjectKey = hasPrefix ? `${prefix}/${imageProcessParamsEncoded}/${imageName}.${extension}` : `${imageProcessParamsEncoded}/${imageName}.${extension}`;

  log('get resizedObject with key', resizeObjectKey)
  const resizedObject = await s3.getObject({
    Bucket: config.bucketName,
    Key: resizeObjectKey,
    ResponseContentType: 'arrayBuffer'
  }).promise().catch(e => {
    log('get resizeObject error', e.message);
    return null;
  })

  log("resizedObject", resizedObject)

  if (!resizedObject?.Body) {
    try {
      const originalObject = await getObject(s3Url);

      log('resize originalObject')
      const {
        buffer: resizedImageBuffer,
        contentType,
      } = await resize(originalObject, {
        height: resizeHeight,
        width: resizeWidth,
        resizeMode: resizeMode,
        quality: requestQuality,
        blur: resizeBlur,
        format: acceptHeader.includes(WEBP_EXTENSION) ? WEBP_EXTENSION : extension,
      })

      log('put resizedObject with key', resizeObjectKey, '& writeGetObjectResponse')
      await Promise.all([
        s3.putObject({
          Bucket: config.bucketName,
          Body: resizedImageBuffer,
          ContentType: contentType,
          CacheControl: 'max-age=31536000',
          Key: resizeObjectKey,
          StorageClass: 'STANDARD',
        }).promise(),
        s3.writeGetObjectResponse({
          RequestRoute: requestRoute,
          RequestToken: requestToken,
          Body: resizedImageBuffer,
        }).promise()
      ]);

      return {
        statusCode: 200,
      }
    } catch (e) {
      return {
        statusCode: e.statusCode,
      }
    }
  }

  log('writeGetObjectResponse', {
    RequestRoute: requestRoute,
    RequestToken: requestToken,
  })
  await s3.writeGetObjectResponse({
    RequestRoute: requestRoute,
    RequestToken: requestToken,
    Body: resizedObject.Body,
  }).promise();

  return {
    statusCode: 200,
  }

};

/**
 * @param {string} url 
 * @returns Buffer
 */
const getObject = async (url) => {
  log('getObject()', url);

  return fetch(url)
    .then(res => {
      if (!res.ok) {
        log('getObject() !ok')

        throw {
          statusCode: res.status,
          message: res.statusText,
        }
      }

      return res.arrayBuffer();
    })
    .then(arrayBuffer => Buffer.from(arrayBuffer, 'binary'))
    .catch(e => {
      log('getObject() error', e.message)

      throw {
        statusCode: 500,
        message: e.message,
      }
    })
};