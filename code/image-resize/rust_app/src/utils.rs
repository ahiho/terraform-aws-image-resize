use std::path::Path;

use base64::Engine;
use lambda_runtime::tracing;
use regex::Regex;
use resize::ResizeParams;
use serde::{Deserialize, Serialize};
use url::Url;

use crate::config::CONFIG;

#[derive(Deserialize, Serialize)]
pub struct ImageProcessParams {
    w: u32,
    h: u32,
    m: String,
    q: String,
    b: u32,
}

pub fn get_file_extension(url_str: &str) -> Option<String> {
    if let Ok(url) = Url::parse(url_str) {
        let path = url.path();
        Path::new(path)
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|s| s.to_string())
    } else {
        None
    }
}

pub fn get_url_path(url_str: &str) -> Option<String> {
    if let Ok(url) = Url::parse(url_str) {
        Some(url.path().to_string())
    } else {
        None
    }
}

pub fn get_resized_image_key(url: &str, params: &ResizeParams) -> String {
    let path = get_url_path(url).unwrap();

    let url_re = Regex::new(r"(.*)\.(.*)").unwrap();
    let url_prefix_re = Regex::new(r"(.*)\/(.*)\.(.*)").unwrap();

    let has_prefix = url_re.is_match(url);

    let mut prefix = "";
    let file_name;
    let extension;

    if has_prefix {
        let groups = url_prefix_re.captures(path.as_str()).unwrap();

        prefix = groups.get(1).unwrap().as_str();
        file_name = groups.get(2).unwrap().as_str();
        extension = groups.get(3).unwrap().as_str();
    } else {
        let group = url_re.captures(path.as_str()).unwrap();

        file_name = group.get(1).unwrap().as_str();
        extension = group.get(2).unwrap().as_str();
    }

    let params = ImageProcessParams {
        w: params.w,
        h: params.h.unwrap_or(CONFIG.default_height),
        m: params.t.to_string(),
        q: params.q.to_string(),
        b: params.b,
    };

    let params_json = serde_json::to_string(&params).expect("Unable to serialize params");
    let encoded_params = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(params_json);

    let resize_object_key = if has_prefix {
        format!("{prefix}/{encoded_params}/{file_name}.{extension}")
    } else {
        format!("{encoded_params}/{file_name}.{extension}")
    };

    tracing::info!("Resize key: {}", resize_object_key);

    resize_object_key
}
