import AwsSDK from "aws-sdk";
import { resize } from "./utils/resize.mjs";
import config from "./utils/config.mjs";
import {
  getQuality,
  getResizeMode,
  getTransform,
  limit,
  roundAndLimit,
} from "./utils/request.mjs";
import { DefaultValues, WEBP_EXTENSION } from "./utils/constant.mjs";
import { log } from "./utils/log.mjs";

const { S3 } = AwsSDK;

/**
 * @param {Object} event - S3 Object Lambda Access Point event
 * @param {Object} _context
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */
export const lambdaHandler = async (event, _context) => {
  log("Config: ", config);
  const { getObjectContext, userRequest } = event;

  const s3 = new S3({
    region: config.region,
  });

  const s3Url = getObjectContext.inputS3Url;
  const requestRoute = getObjectContext.outputRoute;
  const requestToken = getObjectContext.outputToken;

  const urlObject = new URL(userRequest.url);
  const searchParams = new URLSearchParams(urlObject.search);

  try {
    const objectKey = new URL(s3Url).pathname.replace(/^\//, "");
    console.log("objectKey", objectKey);

    const { ContentType } = await s3
      .headObject({
        Bucket: config.bucketAccessPoint,
        Key: objectKey,
      })
      .promise();

    console.log("ContentType", ContentType);

    if (!ContentType.startsWith("image")) {
      log("Ignores non-image content type. Return original object");

      return responseOriginalObject({
        s3,
        s3Url,
        requestRoute,
        requestToken,
      });
    }
  } catch (e) {
    log("Error checking object type", e);

    return {
      statusCode: e?.statusCode ?? 500,
    };
  }

  const isRequestOriginalSource = searchParams.get("o") === "true";

  if (isRequestOriginalSource) {
    log("Request original source. Return original object");

    return responseOriginalObject({
      s3,
      s3Url,
      requestRoute,
      requestToken,
    });
  }

  const userRequestPathname = urlObject.pathname.replace(/^\//, "");
  const urlStructure =
    userRequestPathname.match(/(.*)\/(.*)\.(.*)/) ||
    userRequestPathname.match(/(.*)\.(.*)/);
  const hasPrefix = urlStructure.length > 3;
  const prefix = urlStructure[1];
  const imageName = hasPrefix ? urlStructure[2] : urlStructure[1];
  const extension = hasPrefix ? urlStructure[3] : urlStructure[2];
  const acceptHeader = userRequest.headers["accept"]?.[0].value || "";

  const requestWidth = parseInt(searchParams.get("w")) || undefined;
  const requestHeight = parseInt(searchParams.get("h")) || undefined;
  const requestTransform = getTransform(searchParams.get("t")) || undefined;
  const requestQuality = getQuality(searchParams.get("q")) || undefined;
  const requestBlur = parseInt(searchParams.get("b")) || undefined;

  const resizeMode = getResizeMode(
    requestWidth,
    requestHeight,
    requestTransform,
  );

  const resizeWidth = roundAndLimit(
    requestWidth || DefaultValues.width.default,
    DefaultValues.width.min,
    DefaultValues.width.max,
  );

  const resizeHeight = roundAndLimit(
    requestHeight || DefaultValues.height.default,
    DefaultValues.height.min,
    DefaultValues.height.max,
  );

  const resizeBlur = limit(requestBlur, 0, 50);

  const imageProcessParams = {
    w: resizeWidth,
    h: resizeHeight,
    m: resizeMode,
    q: requestQuality,
    b: resizeBlur,
  };
  log("imageProcessParams", imageProcessParams);

  const imageProcessParamsEncoded = Buffer.from(
    JSON.stringify(imageProcessParams),
  ).toString("base64url");

  const resizeObjectKey = hasPrefix
    ? `${prefix}/${imageProcessParamsEncoded}/${imageName}.${extension}`
    : `${imageProcessParamsEncoded}/${imageName}.${extension}`;

  log("Getting resizedObject with key", resizeObjectKey);
  const resizedObject = await s3
    .getObject({
      Bucket: config.bucketAccessPoint,
      Key: resizeObjectKey,
    })
    .promise()
    .catch((e) => {
      log("get resizeObject error", e.message);
      return null;
    });

  log("resizedObject", resizedObject);
  if (!resizedObject?.Body) {
    try {
      const originalObject = await getObjectFromPresigned(s3Url);

      log("Resize originalObject");
      const { buffer: resizedImageBuffer, contentType } = await resize(
        originalObject.Body,
        {
          height: resizeHeight,
          width: resizeWidth,
          resizeMode: resizeMode,
          quality: requestQuality,
          blur: resizeBlur,
          format: acceptHeader.includes(WEBP_EXTENSION)
            ? WEBP_EXTENSION
            : extension,
        },
      );

      log(
        "Put resizedObject with key",
        resizeObjectKey,
        "& writeGetObjectResponse",
      );
      await Promise.all([
        s3
          .putObject({
            Bucket: config.bucketAccessPoint,
            Body: resizedImageBuffer,
            ContentType: contentType,
            CacheControl: "max-age=31536000",
            Key: resizeObjectKey,
            StorageClass: "STANDARD",
          })
          .promise(),
        s3
          .writeGetObjectResponse({
            RequestRoute: requestRoute,
            RequestToken: requestToken,
            Body: resizedImageBuffer,
            ContentDisposition: originalObject.ContentDisposition,
            ContentType: contentType,
          })
          .promise(),
      ]);

      return {
        statusCode: 200,
      };
    } catch (e) {
      return {
        statusCode: e.statusCode,
      };
    }
  }

  log("Writing getObjectResponse", {
    RequestRoute: requestRoute,
    RequestToken: requestToken,
  });
  await s3
    .writeGetObjectResponse({
      RequestRoute: requestRoute,
      RequestToken: requestToken,
      Body: resizedObject.Body,
      ContentDisposition: resizedObject.ContentDisposition,
      ContentType: resizedObject.ContentType,
    })
    .promise();

  return {
    statusCode: 200,
  };
};

/**
 * @param {string} url
 * @returns {Promise<{Body: Buffer, ContentDisposition: string, ContentType: string}>}
 */
const getObjectFromPresigned = async (url) => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw {
        statusCode: res.status,
        message: res.statusText,
      };
    }

    const arrayBuffer = await res.arrayBuffer();
    const body = Buffer.from(arrayBuffer, "binary");

    return {
      Body: body,
      ContentDisposition: res.headers.get("content-disposition"),
      ContentType: res.headers.get("content-type"),
    };
  } catch (e) {
    log("Unable to get object from presigned", e.message);

    throw {
      statusCode: 500,
      message: e.message,
    };
  }
};

/**
 * @param {Object} params
 * @param {AWS.S3} params.s3
 * @param {string} params.s3Url
 * @param {string} params.requestRoute
 * @param {string} params.requestToken

 * @returns {Promise<Object>} A promise that resolves to an object with a `statusCode` property.
 */
const responseOriginalObject = async ({
  s3,
  s3Url,
  requestRoute,
  requestToken,
}) => {
  try {
    const { Body, ContentDisposition, ContentType } =
      await getObjectFromPresigned(s3Url);

    await s3
      .writeGetObjectResponse({
        RequestRoute: requestRoute,
        RequestToken: requestToken,
        Body,
        ContentDisposition,
        ContentType,
      })
      .promise();

    return {
      statusCode: 200,
    };
  } catch (e) {
    log("Unable to response original object", e.message);

    if (e.statusCode === 403) {
      await s3
        .writeGetObjectResponse({
          RequestRoute: requestRoute,
          RequestToken: requestToken,
          StatusCode: 403,
          ErrorCode: "AccessDenied",
        })
        .promise();

      return {
        statusCode: 200,
      };
    }

    return {
      statusCode: e.statusCode ?? 500,
    };
  }
};
