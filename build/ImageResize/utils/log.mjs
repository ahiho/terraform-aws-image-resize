import config from "./config.mjs";

export const log = (...message) => {
  if (config.logLevel === 'DEBUG') {
    console.log(...message);
  }
}