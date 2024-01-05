import {
  DefaultValues as variables,
  Transform,
  Quality,
  ResizeMode,
} from "./constant.mjs";

/**
 * @param {string} key
 * @returns {Transform}
 */
export const getTransform = (key) => {
  if (key === "f" || key === "fit")
    return Transform.Fit;

  return variables.defaults.transform;
};

/**
 * @param {string} key
 * @returns {Quality}
 */
export const getQuality = (key) => {
  if (key === "l" || key === "low")
    return Quality.Low;

  if (key === "m" || key === "med" || key === "medium")
    return Quality.Medium;

  if (key === "h" || key === "high")
    return Quality.High;

  if (key === "b" || key === "best")
    return Quality.Best;

  return variables.defaults.quality;
};

/**
 * @param {number} width
 * @param {number} height
 * @param {number} transform
 * @returns {ResizeMode}
 */
export const getResizeMode = (width, height, transform) => {
  if (width && height) {
    if (transform === Transform.Crop)
      return ResizeMode.Crop;

    return ResizeMode.Fit;
  }

  if (width)
    return ResizeMode.Width;

  if (height)
    return ResizeMode.Height;

  return ResizeMode.Crop;
};

/**
 * @param {number} value
 * @param {number} lowLimit
 * @param {number} highLimit
 * @param {number} roundingValue
 * @returns {number}
 */
export const roundAndLimit = (value, lowLimit, highLimit, roundingValue = variables.roundToNearest) => {
  const result = Math.round(value / roundingValue) * roundingValue;

  if (result < lowLimit)
    return lowLimit;

  if (result > highLimit)
    return highLimit;

  return result;
};


/**
 * @param {number} value
 * @param {number} lowLimit
 * @param {number} highLimit
 * @returns {number}
 */
export const limit = (value, lowLimit, highLimit) => {
  if (value < lowLimit) {
    return lowLimit;
  }

  if (value > highLimit) {
    return highLimit;
  }

  return value;
}
