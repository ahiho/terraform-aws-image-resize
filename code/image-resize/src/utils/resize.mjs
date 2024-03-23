import sharp from 'sharp';
import { QualityValue } from './constant.mjs';
import { log } from './log.mjs';

/**
 * @typedef {import('./constant.mjs').ResizeMode} ResizeMode
 * @typedef {import('./constant.mjs').Quality} Quality
 */

/**
 * @param {Buffer} imageBuffer 
 * @param {{width: number, height: number, resizeMode: ResizeMode, quality: Quality, format: string, blur: number}} properties 
 */
export const resize = async (imageBuffer, properties) => {
  log('resize params', { imageBuffer, properties })
  const { width, height, resizeMode, quality, format, blur } = properties;

  const sharpImg = sharp(imageBuffer, { pages: -1 });

  sharpImg.resize({
    width,
    height,
    fit: resizeMode === 'c' ? 'cover' : 'inside',
  });

  if (blur > 0) {
    sharpImg.blur(blur);
  }

  const resizedImage = await sharpImg.toFormat(format, {
    quality: getQualityValue(quality),
  }).toBuffer();

  return {
    buffer: resizedImage,
    contentType: `image/${format}`
  }
}

/**
 * @description Get sharp resize pipeline
 * @param {{width: number, height: number, resizeMode: ResizeMode, quality: Quality, format: string, blur: number}} properties 
 */
export const resizePipeline = (properties) => {
  log('resize params', { properties })
  const { width, height, resizeMode, quality, format, blur } = properties;

  const pipeline = sharp().resize({
    width,
    height,
    fit: resizeMode === 'c' ? 'cover' : 'inside',
  });

  if (blur > 0) {
    pipeline.blur(blur);
  }

  return pipeline.toFormat(format, {
    quality: getQualityValue(quality),
  })
}

/**
 * @param {Quality} quality 
 * @returns {number | undefined}
 */
const getQualityValue = (quality) => {
  return QualityValue[quality];
}