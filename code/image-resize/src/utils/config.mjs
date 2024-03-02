import { Quality, Transform } from "./enum.mjs";

const region = process.env.BUCKET_REGION;
const bucketAccessPoint = process.env.BUCKET_ACCESS_POINT;

const roundingValue = process.env.ROUNDING_VALUE;
const minWidth = process.env.MIN_WIDTH;
const minHeight = process.env.MIN_HEIGHT;
const maxWidth = process.env.MAX_WIDTH;
const maxHeight = process.env.MAX_HEIGHT;
const defaultWidth = process.env.DEFAULT_WIDTH;
const defaultHeight = process.env.DEFAULT_HEIGHT;
const defaultQuality = process.env.DEFAULT_QUALITY;
const defaultTransform = process.env.DEFAULT_TRANSFORM;

const logLevel = process.env.LOG_LEVEL;

if (!region || !bucketAccessPoint) {
  throw new Error(
    "IMAGE_BUCKET_REGION and IMAGE_BUCKET_NAME environment variables are required",
  );
}

if (defaultQuality && !Object.values(Quality).includes(defaultQuality)) {
  throw new Error(
    `Invalid default quality value. Expected value is one of ${Object.values(Quality).join(", ")}, received ${defaultQuality.toString()}`
  )
}

if (defaultTransform && !Object.values(Transform).includes(defaultTransform)) {
  throw new Error(
    `Invalid default transform value. Expected value is one of ${Object.values(Transform).join(", ")}, received ${defaultTransform.toString()}`
  )
}

const parseNumber = (val) => {
  if (val === null || val === undefined) {
    return undefined;
  } else return Number(val);
};

const config = {
  region,
  bucketAccessPoint,

  roundingValue: parseNumber(roundingValue),
  minWidth: parseNumber(minWidth),
  minHeight: parseNumber(minHeight),
  maxWidth: parseNumber(maxWidth),
  maxHeight: parseNumber(maxHeight),
  defaultWidth: parseNumber(defaultWidth),
  defaultHeight: parseNumber(defaultHeight),
  defaultQuality: defaultQuality || undefined,
  defaultTransform: defaultTransform || undefined,

  logLevel,
};

export default config;