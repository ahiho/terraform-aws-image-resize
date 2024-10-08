use std::env;

use lazy_static::lazy_static;

use crate::{ImageQuality, TransformMode};

pub struct Config {
    pub rounding_value: u32,
    pub min_width: u32,
    pub min_height: u32,
    pub max_width: u32,
    pub max_height: u32,
    pub default_width: u32,
    pub default_height: u32,
    pub default_quality: ImageQuality,
    pub default_transform: TransformMode,
}

impl Config {
    pub fn new() -> Self {
        let parse_number = |val: String| val.parse::<u32>().ok();

        let rounding_value = env::var("ROUNDING_VALUE").ok().and_then(parse_number).unwrap_or(10);
        let min_width = env::var("MIN_WIDTH").ok().and_then(parse_number).unwrap_or(100);
        let min_height = env::var("MIN_HEIGHT").ok().and_then(parse_number).unwrap_or(100);
        let max_width = env::var("MAX_WIDTH").ok().and_then(parse_number).unwrap_or(4100);
        let max_height = env::var("MAX_HEIGHT").ok().and_then(parse_number).unwrap_or(4100);
        let default_width = env::var("DEFAULT_WIDTH").ok().and_then(parse_number).unwrap_or(640);
        let default_height = env::var("DEFAULT_HEIGHT").ok().and_then(parse_number).unwrap_or(400);
        let default_quality = match env::var("DEFAULT_QUALITY").ok().as_deref() {
            Some("l") => ImageQuality::Low,
            Some("m") => ImageQuality::Medium,
            Some("h") => ImageQuality::High,
            Some("b") => ImageQuality::Best,
            _ => ImageQuality::High
        };
        let default_transform = match env::var("DEFAULT_TRANSFORM").ok().as_deref() {
            Some("c") => TransformMode::Crop,
            Some("f") => TransformMode::Fit,
            _ => TransformMode::Fit,
        };

        Config {
            rounding_value,
            min_width,
            min_height,
            max_width,
            max_height,
            default_width,
            default_height,
            default_quality,
            default_transform,
        }
    }
}

lazy_static! {
    pub static ref CONFIG: Config = Config::new();
}
