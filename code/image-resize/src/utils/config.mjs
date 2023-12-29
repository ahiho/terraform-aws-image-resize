const region = process.env.IMAGE_BUCKET_REGION;
const bucketName = process.env.IMAGE_BUCKET_NAME;
const roundingValue = process.env.ROUNDING_VALUE;

if (!region || !bucketName) {
  throw new Error('IMAGE_BUCKET_REGION and IMAGE_BUCKET_NAME environment variables are required');
}

const config = {
  region,
  bucketName,
  roundingValue: roundingValue ? Number(roundingValue) : undefined,
}

export default config;