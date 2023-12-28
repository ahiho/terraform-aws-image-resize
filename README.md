# Image Resizing Terraform Module

- [Image Resizing Terraform Module](#image-resizing-terraform-module)
  - [Solution Architecture](#solution-architecture)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Distribution query parameters](#distribution-query-parameters)
    - [Lambda function spec](#lambda-function-spec)
    - [How to test](#how-to-test)
  - [References](#references)


## Solution Architecture
![alt text](./docs/overview.png)

## Installation


## Usage

### Distribution query parameters
| Headers   | Description               | Valid Values            | Type    | Default |
| --------- | ------------------------- | ----------------------- | ------- | ------- |
| transform | image transformation mode | fit, crop               | string  | crop    |
| width     | specifies image width     | 100, 200,...            | int     |         |
| quality   | specifies image quality   | low, medium, high, best | string  | high    |
| height    | specifies image height    | 100, 200,...            | int     |         |
| original  | get the original image    | true, false             | boolean | false   |

### Lambda function spec


### How to test

## References
- https://aws.amazon.com/blogs/aws/new-use-amazon-s3-object-lambda-with-amazon-cloudfront-to-tailor-content-for-end-users/
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/transforming-objects.html
