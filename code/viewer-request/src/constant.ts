export enum Transform {
  Fit,
  Crop,
}

export enum Quality {
  Low = 'l',
  Medium = 'm',
  High = 'h',
  Best = 'b',
}

export enum ResizeMode {
  Width = 'w',
  Height = 'h',
  Crop = 'c',
  Fit = 'f',
}

export const DefaultValues = {
  width: { min: 100, max: 4100, default: 640 },
  height: { min: 100, max: 4100, default: 400 },
  roundToNearest: 10,
  defaults: { quality: Quality.Medium, transform: Transform.Crop },
  webpExtension: 'webp',
};