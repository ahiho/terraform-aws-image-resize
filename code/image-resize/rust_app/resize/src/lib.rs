use config::CONFIG;
use fast_image_resize::{images::Image, CpuExtensions, IntoImageView, ResizeOptions, Resizer};
use image::{
    codecs::{
        jpeg::JpegEncoder,
        png::{CompressionType, FilterType, PngEncoder},
        webp::WebPEncoder,
    },
    ColorType, ImageEncoder,
};
use image::{DynamicImage, GenericImageView};
use lambda_runtime::tracing;
use libblur::FastBlurChannels;
use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};
use std::{collections::HashMap, io::Cursor, time::Instant};
use url::Url;
use utils::limit;

mod config;
mod utils;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub enum ImageQuality {
    Low,
    Medium,
    High,
    Best,
}

#[derive(Debug, Clone)]
pub enum ImageFormat {
    Png,
    Jpeg,
    Webp,
    Gif,
}

#[derive(Debug, Clone)]
pub enum TransformMode {
    Fit,
    Crop,
}

impl Display for TransformMode {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            TransformMode::Fit => write!(f, "f"),
            TransformMode::Crop => write!(f, "c"),
        }
    }
}

impl Display for ImageQuality {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            ImageQuality::Low => write!(f, "l"),
            ImageQuality::Medium => write!(f, "m"),
            ImageQuality::High => write!(f, "h"),
            ImageQuality::Best => write!(f, "b"),
        }
    }
}

impl ImageFormat {
    pub fn from_extension(ext: &str) -> Option<Self> {
        match ext {
            "png" => Some(Self::Png),
            "jpg" | "jpeg" => Some(Self::Jpeg),
            "webp" => Some(Self::Webp),
            "gif" => Some(Self::Gif),
            _ => None,
        }
    }
}

impl From<ImageFormat> for image::ImageFormat {
    fn from(val: ImageFormat) -> Self {
        match val {
            ImageFormat::Png => image::ImageFormat::Png,
            ImageFormat::Gif => image::ImageFormat::Gif,
            ImageFormat::Jpeg => image::ImageFormat::Jpeg,
            ImageFormat::Webp => image::ImageFormat::WebP,
        }
    }
}

impl From<String> for ImageFormat {
    fn from(val: String) -> Self {
        match val.to_lowercase().as_str() {
            "png" | "image/png" => Self::Png,
            "jpg" | "jpeg" | "image/jpeg" => Self::Jpeg,
            "webp" | "image/webp" => Self::Webp,
            _ => Self::Jpeg,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ResizeParams {
    pub t: TransformMode, // Transformation mode: "fit" or "crop"
    pub w: u32,           // Width
    pub h: Option<u32>,   // Height
    pub o: bool,          // Get original image
    pub b: u32,           // Blur level
    pub q: ImageQuality,  // Image quality
}

impl ResizeParams {
    pub fn from_url(url: &str) -> Result<Self, String> {
        let url = Url::parse(url).map_err(|_| "Failed to parse URL".to_string())?;

        let search_params: HashMap<_, _> = url.query_pairs().into_owned().collect();

        let t = match search_params.get("t").map(String::as_str) {
            Some("fit") | Some("f") => TransformMode::Fit,
            Some("crop") | Some("c") => TransformMode::Crop,
            _ => CONFIG.default_transform.clone(),
        };

        let w = search_params
            .get("w")
            .and_then(|w| w.parse::<u32>().ok())
            .map(|w| limit(w, CONFIG.min_width, CONFIG.max_width, None))
            .unwrap_or(CONFIG.default_width);

        let h = search_params
            .get("h")
            .and_then(|h| h.parse::<u32>().ok())
            .map(|w| limit(w, CONFIG.min_height, CONFIG.max_height, None));

        let o = search_params.get("o").map(|o| o == "true").unwrap_or(false);

        let b = search_params
            .get("b")
            .and_then(|b| b.parse::<u8>().ok())
            .map(|b| limit(b.into(), 0, 50, None))
            .unwrap_or(0);

        let q = match search_params.get("q").map(String::as_str) {
            Some("low") | Some("l") => ImageQuality::Low,
            Some("medium") | Some("m") => ImageQuality::Medium,
            Some("high") | Some("h") => ImageQuality::High,
            Some("best") | Some("b") => ImageQuality::Best,
            _ => CONFIG.default_quality.clone(),
        };

        Ok(ResizeParams { t, w, h, o, b, q })
    }
}

fn get_png_quality(img_quality: ImageQuality) -> CompressionType {
    match img_quality {
        ImageQuality::Low => CompressionType::Default,
        ImageQuality::Medium => CompressionType::Default,
        ImageQuality::High => CompressionType::Fast,
        ImageQuality::Best => CompressionType::Best,
    }
}

fn get_jpeg_quality(img_quality: ImageQuality) -> u8 {
    match img_quality {
        ImageQuality::Low => 25,
        ImageQuality::Medium => 50,
        ImageQuality::High => 75,
        ImageQuality::Best => 100,
    }
}

pub fn resize_image(
    img_buf: &[u8],
    params: ResizeParams,
    format: ImageFormat,
    target_format: Option<ImageFormat>,
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let start = Instant::now();
    let mut reader = image::ImageReader::new(Cursor::new(img_buf));
    reader.set_format(format.clone().into());

    let img: DynamicImage = match reader.decode() {
        Ok(img) => img,
        Err(_) => {
            // Try to detect the format
            let detected_format = match imghdr::from_bytes(img_buf) {
                Some(imghdr::Type::Jpeg) => ImageFormat::Jpeg,
                Some(imghdr::Type::Png) => ImageFormat::Png,
                Some(imghdr::Type::Webp) => ImageFormat::Webp,
                Some(imghdr::Type::Gif) => ImageFormat::Gif,
                _ => return Err("Unknown file format".into()),
            };

            let mut reader = image::ImageReader::new(Cursor::new(img_buf));
            reader.set_format(detected_format.into());

            reader.decode()?
        }
    };

    let duration = start.elapsed();
    tracing::info!("Load time: {:?}", duration);

    let (width, height) = img.dimensions();

    let start = Instant::now();
    let duration = start.elapsed();
    tracing::info!("Init resizer time: {:?}", duration);

    let original_ratio = width as f32 / height as f32;

    let img_height = match params.t {
        TransformMode::Fit => params
            .h
            .unwrap_or_else(|| (params.w as f32 / original_ratio) as u32),
        TransformMode::Crop => params.h.unwrap_or(CONFIG.default_height),
    };

    let format_to_use = target_format.unwrap_or(format);

    match format_to_use {
        ImageFormat::Gif => resize_multi_pages(img, params.w, img_height, params.t),
        _ => resize_single_page(
            img,
            format_to_use,
            params.w,
            img_height,
            params.t,
            params.b,
            params.q,
        ),
    }
}

// TODO: Fix multi pages image handling
fn resize_multi_pages(
    img: DynamicImage,
    width: u32,
    height: u32,
    transform: TransformMode,
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    tracing::info!("Resizing multi pages image: {}, {}", width, height);

    let resized_img = match transform {
        TransformMode::Fit => {
            img.resize_to_fill(width, height, image::imageops::FilterType::Lanczos3)
        }
        TransformMode::Crop => img.resize(width, height, image::imageops::FilterType::Lanczos3),
    };

    let mut buf = Cursor::new(Vec::new());

    resized_img.write_to(&mut buf, ImageFormat::Gif.into())?;

    Ok(buf.into_inner())
}

fn resize_single_page(
    img: DynamicImage,
    format: ImageFormat,
    width: u32,
    height: u32,
    transform: TransformMode,
    blur: u32,
    quality: ImageQuality,
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let mut resizer = Resizer::new();

    let (origin_width, origin_height) = img.dimensions();
    let color = img.color();

    #[cfg(target_arch = "x86_64")]
    unsafe {
        resizer.set_cpu_extensions(CpuExtensions::Avx2);
    }

    let mut final_image = Image::new(width, height, img.pixel_type().unwrap());

    let start = Instant::now();
    match transform {
        TransformMode::Fit => resizer
            .resize(
                &img,
                &mut final_image,
                &ResizeOptions::new().fit_into_destination(Some((0.5, 0.5))),
            )
            .unwrap(),
        TransformMode::Crop => {
            let left = (origin_width - width) / 2;
            let top = (origin_height - height) / 2;
            resizer
                .resize(
                    &img,
                    &mut final_image,
                    &ResizeOptions::new().crop(
                        left.into(),
                        top.into(),
                        width.into(),
                        height.into(),
                    ),
                )
                .unwrap();
        } // _ => return Err("Invalid transformation mode".into()),
    };
    let duration = start.elapsed();
    tracing::info!("Resize time: {:?}", duration);

    let final_image_buf = final_image.buffer_mut();

    let start = Instant::now();
    // Apply blur if specified

    let channel_count = match img.color() {
        ColorType::Rgba8 | ColorType::Rgba16 | ColorType::Rgba32F => 4,
        _ => 3,
    };

    if blur > 0 {
        libblur::stack_blur(
            final_image_buf,
            width * channel_count,
            width,
            height,
            blur,
            match channel_count {
                4 => FastBlurChannels::Channels4,
                _ => FastBlurChannels::Channels3,
            },
            libblur::ThreadingPolicy::Single,
        );
    };
    let duration = start.elapsed();
    tracing::info!("Blur time: {:?}", duration);

    let mut buffer = Vec::new();

    let start = Instant::now();
    match format {
        ImageFormat::Png => PngEncoder::new_with_quality(
            &mut buffer,
            get_png_quality(quality),
            FilterType::Adaptive,
        )
        .write_image(final_image_buf, width, height, color.into())
        .unwrap(),

        ImageFormat::Jpeg => JpegEncoder::new_with_quality(&mut buffer, get_jpeg_quality(quality))
            .write_image(final_image_buf, width, height, color.into())
            .unwrap(),

        ImageFormat::Webp => WebPEncoder::new_lossless(&mut buffer)
            .write_image(final_image_buf, width, height, color.into())
            .unwrap(),

        _ => return Err("Unknown format".into()),
    };
    let duration = start.elapsed();
    tracing::info!("Encode time: {:?}", duration);

    Ok(buffer)
}