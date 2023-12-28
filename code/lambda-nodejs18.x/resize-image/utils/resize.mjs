import sharp from 'sharp';
import { QualityValue } from './constant.mjs';

/**
 * @typedef {import('./constant.mjs').ResizeMode} ResizeMode
 * @typedef {import('./constant.mjs').Quality} Quality
 */

/**
 * @param {Buffer} imageBuffer 
 * @param {{width: number, height: number, resizeMode: ResizeMode, quality: Quality, format: string, blur: number}} properties 
 */
export const resize = async (imageBuffer, properties) => {
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
 * @param {Quality} quality 
 * @returns {number | undefined}
 */
const getQualityValue = (quality) => {
  return QualityValue[quality];
}