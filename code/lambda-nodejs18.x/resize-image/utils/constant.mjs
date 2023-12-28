/**
 * Transform enum
 * @readonly
 * @enum {number}
 */
export const Transform = {
  Fit: 0,
  Crop: 1,
};

/**
 * Quality enum
 * @readonly
 * @enum {string}
 */
export const Quality = {
  Low: 'l',
  Medium: 'm',
  High: 'h',
  Best: 'b',
};

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
 * Resize mode enum
 * @readonly
 * @enum {string}
 */
export const ResizeMode = {
  Width: 'w',
  Height: 'h',
  Crop: 'c',
  Fit: 'f',
};


/**
 * Default values
 * @readonly
 * @enum {Object | string | number}
 */
export const DefaultValues = {
  width: { min: 100, max: 4100, default: 640 },
  height: { min: 100, max: 4100, default: 400 },
  roundToNearest: 10,
  defaults: { quality: Quality.High, transform: Transform.Crop },
};

export const WEBP_EXTENSION = 'webp';

export const PREFIX_FILE_URL_REGEX = /(.*)\/(.*)\.(.*)/;
export const FILE_URL_REGEX = /(.*)\.(.*)/;