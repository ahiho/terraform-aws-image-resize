import config from './config.mjs'
import { Quality, Transform } from './enum.mjs'

/**
 * Quality values for image resizing.
 * @readonly
 * @enum {number}
 */
export const QualityValue = {
  [Quality.Low]: 40,
  [Quality.Medium]: 60,
  [Quality.High]: 80,
  [Quality.Best]: 100,
};

/**
 * Default values
 * @readonly
 * @enum {Object | string | number}
 */
export const DefaultValues = {
  width: {
    min: config.minWidth ?? 100,
    max: config.maxWidth ?? 4100,
    default: config.defaultWidth ?? 640,
  },
  height: {
    min: config.minHeight ?? 100,
    max: config.maxHeight ?? 4100,
    default: config.defaultHeight ?? 400
  },
  roundToNearest: config.roundingValue ?? 10,
  quality: config.defaultQuality || Quality.High,
  transform: config.defaultTransform || Transform.Crop
};

export const WEBP_EXTENSION = 'webp';

export const PREFIX_FILE_URL_REGEX = /(.*)\/(.*)\.(.*)/;
export const FILE_URL_REGEX = /(.*)\.(.*)/;