use async_trait::async_trait;
use aws_lambda_events::s3::object_lambda::{GetObjectContext, UserRequest};
use aws_sdk_s3::{
    error::SdkError, operation::write_get_object_response::WriteGetObjectResponseError,
    primitives::ByteStream, Client as S3Client,
};
use lambda_runtime::tracing;
use serde::{Deserialize, Serialize};
use std::{error, io::Read};

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct S3ObjectLambdaEvent {
    pub get_object_context: Option<GetObjectContext>,
    pub user_request: UserRequest,
}

#[async_trait]
pub trait GetFile {
    async fn get_file(&self, key: &str, bucket: &str) -> Result<(Vec<u8>, Option<String>), String>;
}

pub trait GetFileUrl {
    fn get_file_url(&self, url: &str) -> Result<(Vec<u8>, Option<String>), Box<dyn error::Error>>;
}

#[async_trait]
pub trait PutFile {
    async fn put_file(
        &self,
        key: &str,
        img_buf: Vec<u8>,
        content_type: &str,
        bucket: &str,
    ) -> Result<String, Box<dyn std::error::Error>>;
}

#[async_trait]
pub trait SendFile {
    async fn send_file(
        &self,
        route: String,
        token: String,
        vec: Vec<u8>,
        content_type: &str,
    ) -> Result<String, Box<dyn error::Error>>;
}

// TODO: Implement this trait
#[async_trait]
pub trait SendErrorResponse {
  async fn send_error_response(
        &self,
        route: String,
        token: String,
        status_code: u16,
        error_code: String,
        error_message: String,
    ) -> Result<String, Box<dyn error::Error>>;
}

impl GetFileUrl for S3Client {
    fn get_file_url(&self, url: &str) -> Result<(Vec<u8>, Option<String>), Box<dyn error::Error>> {
        tracing::info!("[S3] Get file url {}", url);

        let resp = match ureq::get(url).call() {
            Ok(resp) => resp,
            Err(e) => return Err(e.into()),
        };

        let len: usize = resp.header("Content-Length").unwrap().parse()?;
        let content_type = resp.header("Content-Type").map(|ct| ct.to_owned());
        let mut bytes: Vec<u8> = Vec::with_capacity(len);
        std::io::Read::take(resp.into_reader(), 50_000_000).read_to_end(&mut bytes)?;

        tracing::info!("[S3] Got {} bytes", bytes.len());

        Ok((bytes, content_type))
    }
}

#[async_trait]
impl GetFile for S3Client {
    async fn get_file(&self, key: &str, bucket: &str) -> Result<(Vec<u8>, Option<String>), String> {
        tracing::info!("[S3] Get file bucket {}, key {}", bucket, key);

        let output = self.get_object().bucket(bucket).key(key).send().await;

        return match output {
            Ok(response) => {
                let bytes = response.body.collect().await.unwrap().to_vec();
                let content_type = response.content_type;
                tracing::info!("[S3] Object is downloaded, size is {}", bytes.len());

                Ok((bytes, content_type))
            }
            Err(sdk_error) => {
                let service_err = sdk_error.into_service_error();
                let meta = service_err.meta();
                tracing::info!("[S3] Error from aws when downloading: {}", meta.to_string());

                Err("GetObject error".into())
            }
        };
    }
}

#[async_trait]
impl SendFile for S3Client {
    async fn send_file(
        &self,
        route: String,
        token: String,
        vec: Vec<u8>,
        content_type: &str,
    ) -> Result<String, Box<dyn error::Error>> {
        tracing::info!(
            "[S3] Send file route {}, token {}, length {}",
            route,
            token,
            vec.len()
        );

        let bytes = ByteStream::from(vec);

        let write = self
            .write_get_object_response()
            .request_route(route)
            .request_token(token)
            .status_code(200)
            .body(bytes)
            .content_type(content_type)
            .send()
            .await;

        if write.is_err() {
            let sdk_error = write.err().unwrap();
            check_write_object_response_error(sdk_error);

            Err("WriteGetObjectResponse creation error".into())
        } else {
            Ok("File sent.".to_string())
        }
    }
}

#[async_trait]
impl PutFile for S3Client {
    async fn put_file(
        &self,
        key: &str,
        img_buf: Vec<u8>,
        content_type: &str,
        bucket: &str,
    ) -> Result<String, Box<dyn std::error::Error>> {
        tracing::info!("put file bucket {}, key {}", bucket, key);
        let bytes = ByteStream::from(img_buf);
        let result = self
            .put_object()
            .bucket(bucket)
            .key(key)
            .body(bytes)
            .content_type(content_type)
            .send()
            .await;

        match result {
            Ok(_) => Ok(format!("Uploaded a file with key {} into {}", key, bucket)),
            Err(err) => Err(err.into_service_error().meta().message().unwrap().into()),
        }
    }
}

fn check_write_object_response_error(error: SdkError<WriteGetObjectResponseError>) {
    match error {
        SdkError::ConstructionFailure(_err) => {
            tracing::info!("ConstructionFailure");
        }

        SdkError::DispatchFailure(err) => {
            tracing::info!("DispatchFailure");

            if err.is_io() {
                tracing::info!("IO error");
            };

            if err.is_timeout() {
                tracing::info!("Timeout error");
            };

            if err.is_user() {
                tracing::info!("User error");
            };

            if err.is_other() {
                tracing::info!("Other error {:?}", err);
            };
        }
        SdkError::ResponseError(_err) => tracing::info!("ResponseError"),

        SdkError::TimeoutError(_err) => tracing::info!("TimeoutError"),

        SdkError::ServiceError(err) => {
            tracing::info!("ServiceError");

            let wgore = err.into_err();
            let meta = wgore.meta();
            let code = meta.code().unwrap_or_default();
            let msg = meta.message().unwrap_or_default();

            tracing::info!("code: {}, message: {}, meta: {}", code, msg, meta);
        }
        _ => tracing::info!("other error"),
    }
}