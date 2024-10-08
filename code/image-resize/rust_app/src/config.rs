use std::env;

use lazy_static::lazy_static;

pub struct Config {
    #[allow(dead_code)]
    pub region: String,
    pub bucket_access_point: String,
    pub valid_extensions: Vec<String>,
    pub default_height: u32
}

impl Config {
    pub fn new() -> Self {
        let region =
            env::var("BUCKET_REGION").expect("BUCKET_REGION environment variable is required");
        let bucket_access_point = env::var("BUCKET_ACCESS_POINT")
            .expect("BUCKET_ACCESS_POINT environment variable is required");

        let valid_extensions = env::var("VALID_EXTENSIONS").ok().map(|val| val.split(',').map(String::from).collect()).unwrap_or(
            vec!["jpg", "jpeg", "png", "gif", "webp"].iter().map(|&s| s.to_string()).collect()
        );

        let default_height = env::var("DEFAULT_HEIGHT").ok().and_then(|val: String| val.parse::<u32>().ok()).unwrap_or(400);

        Config {
            region,
            bucket_access_point,
            valid_extensions,
            default_height
        }
    }
}

lazy_static! {
    pub static ref CONFIG: Config = Config::new();
}
