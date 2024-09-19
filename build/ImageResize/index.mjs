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
import {
  DefaultValues,
  WEBP_EXTENSION,
  VALID_IMAGE_EXTENSIONS,
} from "./utils/constant.mjs";
import { log } from "./utils/log.mjs";

const { S3 } = AwsSDK;

/**
 * @param {Object} event - S3 Object Lambda Access Point event
 * @param {Object} _context
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */
export const lambdaHandler = async (event, _context) => {
  console.log("config: ", config);
  const { getObjectContext, userRequest } = event;

  const s3 = new S3({
    region: config.region,
  });

  const s3Url = getObjectContext.inputS3Url;
  const requestRoute = getObjectContext.outputRoute;
  const requestToken = getObjectContext.outputToken;

  const urlObject = new URL(userRequest.url);
  const searchParams = new URLSearchParams(urlObject.search);

  const isRequestOriginalSource = searchParams.get("o") === "true";

  if (isRequestOriginalSource) {
    log("return originalObject");
    try {
      const { Body, ContentDisposition, ContentType } =
        await getObjectFromPresigned(s3Url);
      log("get originalObject success");
      await s3
        .writeGetObjectResponse({
          RequestRoute: requestRoute,
          RequestToken: requestToken,
          Body,
          ContentDisposition,
          ContentType,
        })
        .promise();
    } catch (e) {
      log("return originalObject error", e)
      await writeNotFoundResponse(s3, requestRoute, requestToken);
    }

    return {
      statusCode: 200,
    };
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

  if (!VALID_IMAGE_EXTENSIONS.includes(extension.toLowerCase())) {
    log("return originalObject - non-image file");
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
    } catch (e) {
      log("return originalObject error", e);
      await writeNotFoundResponse(s3, requestRoute, requestToken);

      return {
        statusCode: 200,
      };
    }
  }

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

  log("get resizedObject with key", resizeObjectKey);
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

      log("resize originalObject");
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
        "put resizedObject with key",
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
    } catch (e) {
      log("put resizedObject & writeObject error", e)
      await writeNotFoundResponse(s3, requestRoute, requestToken)
    }

    return {
      statusCode: 200,
    };
  }

  log("writeGetObjectResponse", {
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
  log("getObjectFromPresigned()", url);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      log("getObjectFromPresigned() !ok");

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
    log("getObjectFromPresigned() error", e.message);

    throw {
      statusCode: 500,
      message: e.message,
    };
  }
};

/**
 * @param {S3} s3
 * @param {string} requestRoute
 * @param {string} requestToken
 */
const writeNotFoundResponse = async (s3, requestRoute, requestToken) => {
  await s3
    .writeGetObjectResponse({
      RequestRoute: requestRoute,
      RequestToken: requestToken,
      StatusCode: 404,
      ErrorCode: "NotFound",
      ErrorMessage: "Object Not Found",
    })
    .promise();
};

