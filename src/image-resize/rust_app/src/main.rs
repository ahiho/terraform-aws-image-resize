use std::{error, time::Instant};

use aws_lambda_events::s3::object_lambda::GetObjectContext;
use aws_sdk_s3::Client as S3Client;
use config::CONFIG;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use resize::{self, ImageFormat, ResizeParams};
use s3::{GetFile, GetFileUrl, PutFile, S3ObjectLambdaEvent, SendFile};
use utils::{get_file_extension, get_resized_image_key};

mod config;
mod s3;
mod utils;

// ===============================
//      Main Function Handler
// ===============================
async fn function_handler<T: SendFile + GetFileUrl + GetFile + PutFile>(
    event: LambdaEvent<S3ObjectLambdaEvent>,
    client: &T,
) -> Result<String, Box<dyn error::Error>> {
    tracing::info!("Handler starts");

    let context: GetObjectContext = event.payload.get_object_context.unwrap();

    let route = context.output_route;
    let token = context.output_token;
    let s3_url = context.input_s3_url;
    let user_request_url = event.payload.user_request.url;

    let params = ResizeParams::from_url(&user_request_url).expect("Invalid resize parameters");

    tracing::info!("Route: {}, s3_url: {}", route, s3_url);

    let start = Instant::now();
    let (image, content_type) = client.get_file_url(&s3_url)?;
    let duration = start.elapsed();
    tracing::info!("Image loaded. Length: {}", image.len());
    tracing::info!("Get file time: {:?}", duration);

    if params.o {
        return client
            .send_file(
                route,
                token,
                image,
                content_type
                    .unwrap_or(String::from("application/octet-stream"))
                    .as_str(),
            )
            .await;
    }

    let image_extension =
        get_file_extension(user_request_url.as_str()).expect("No image extension found");

    if !CONFIG.valid_extensions.contains(&image_extension) {
        return client
            .send_file(
                route,
                token,
                image,
                content_type
                    .unwrap_or(String::from("application/octet-stream"))
                    .as_str(),
            )
            .await;
    }

    let image_slice = image.as_slice();
    let image_format =
        ImageFormat::from_extension(image_extension.as_str()).expect("Unknown image format");
    let resized_image_key = get_resized_image_key(&s3_url, &params);
    let resized_image: Vec<u8>;

    tracing::info!("Trying to retrive resized image with key {resized_image_key:?}");

    let default_content_type = format!(
        "image/{}",
        if image_extension.is_empty() {
            "*"
        } else {
            image_extension.as_str()
        }
    );

    match client
        .get_file(resized_image_key.as_str(), &CONFIG.bucket_access_point)
        .await
    {
        Ok((image, ct)) => {
            tracing::info!("Retrieved resized image");

            return client
                .send_file(
                    route,
                    token,
                    image,
                    ct.unwrap_or(default_content_type).as_str(),
                )
                .await
        }
        Err(_) => {
            let start = Instant::now();

            resized_image = resize::resize_image(image_slice, params, image_format)
                .expect("Image resize failed");

            let resized_image_content_type = content_type.clone().unwrap_or(default_content_type);

            let duration = start.elapsed();
            tracing::info!("Process time: {:?}", duration);

            let put_file_future = client.put_file(
                resized_image_key.as_str(),
                resized_image.clone(),
                resized_image_content_type.as_str(),
                &CONFIG.bucket_access_point,
            );

            let send_file_future = client.send_file(
                route,
                token,
                resized_image.clone(),
                resized_image_content_type.as_str(),
            );

            let (_, send_file_result) =
                tokio::try_join!(put_file_future, send_file_future).unwrap();

            return Ok(send_file_result);
        }
    };
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // required to enable CloudWatch error logging by the runtime
    tracing::init_default_subscriber();

    let shared_config = aws_config::load_from_env().await;
    let client = S3Client::new(&shared_config);
    let client_ref = &client;

    let func = service_fn(move |event| async move { function_handler(event, client_ref).await });

    let _ = run(func).await?;

    Ok(())
}