import AwsSDK from "aws-sdk";
import config from "./config.mjs";
import stream from "stream";
import { log } from "./log.mjs";

const { S3 } = AwsSDK;

export const s3 = new S3({
  region: config.region,
})

export const getS3ObjectStream = (key) => {
  return s3
    .getObject({
      Bucket: config.bucketAccessPoint,
      Key: key,
    })
    .createReadStream();
}

/**
 * @param {{ContentType: string, CacheControl: string, Key: string, StorageClass: string}} params
 * 
 */
export const putS3ObjectStream = (params) => {
  const pass = new stream.PassThrough();

  // FIXME: upload method is being deprecated
  const result = s3.upload({
    Body: pass,
    Bucket: config.bucketAccessPoint,
    ...params,
  }).promise();

  return {
    writeStream: pass,
    result,
  }
}

/**
 * @param {S3.WriteGetObjectResponseRequest}
 */
export const writeS3GetObjectResponseStream = (params) => {
  const pass = new stream.PassThrough();

  const result = s3.writeGetObjectResponse({
    Body: pass,
    ...params,
  }).promise();

  return {
    writeStream: pass,
    result
  }
}

/**
 * @param {string} url
 * @returns {Promise<{Body: Buffer, ContentDisposition: string, ContentType: string}>}
 */
export const getObjectFromPresigned = async (url) => {
  log('getObjectFromPresigned()', url);

  const {
    body: res,
    ContentDisposition,
    ContentType,
  } = await getObjectFromPresignedStream(url);


  const arrayBuffer = await res.arrayBuffer();
  const body = Buffer.from(arrayBuffer, 'binary');

  return {
    Body: body,
    ContentDisposition,
    ContentType,
  };
};

/**
 * @param {string} url
 * @returns {Promise<{body: ReadableStream<Uint8Array | null>, readStream: stream.Stream, ContentDisposition: string, ContentType: string}>}
 */
export const getObjectFromPresignedStream = async (url) => {
  log('getObjectFromPresignedStream()', url);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      log('getObjectFromPresignedStream() !ok')

      throw {
        statusCode: res.status,
        message: res.statusText,
      }
    }

    return {
      body: res.body,
      readStream: stream.Readable.fromWeb(res.body),
      ContentDisposition: res.headers.get("content-disposition"),
      ContentType: res.headers.get("content-type"),
    };
  } catch (e) {
    log('getObjectFromPresignedStream() error', e.message)

    throw {
      statusCode: 500,
      message: e.message,
    }
  }
}