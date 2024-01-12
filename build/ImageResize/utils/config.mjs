const region = process.env.BUCKET_REGION;
const bucketAccessPoint = process.env.BUCKET_ACCESS_POINT;
const roundingValue = process.env.ROUNDING_VALUE;
const logLevel = process.env.LOG_LEVEL;

if (!region || !bucketAccessPoint) {
  throw new Error('IMAGE_BUCKET_REGION and IMAGE_BUCKET_NAME environment variables are required');
}

const config = {
  region,
  bucketAccessPoint,
  roundingValue: roundingValue ? Number(roundingValue) : undefined,
  logLevel
}

export default config;