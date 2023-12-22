// @ts-check
const AWS = require('aws-sdk')


const config = {
    region: process.env.REGION ? process.env.REGION : 'ap-southeast-1',
    bucketName: process.env.IMAGE_BUCKET_NAME ? process.env.IMAGE_BUCKET_NAME : 'arn:aws:s3-object-lambda:ap-southeast-1:633674601707:accesspoint/image-bucket-ln4syo9w1',
}


exports.handler = async (event, context, callback) => {
    const res = event.Records[0].cf.response;

    if (res.status !== "200") {
        const req = event.Records[0].cf.request;
        const s3 = new AWS.S3({
            signatureVersion: 'v4',
            region: config.region
        });

        const object = await s3.getObject({
            Bucket: config.bucketName,
            Key: decodeURIComponent(req.uri.replace(/^\//, '')),

        }).promise()


        return {
            ...res,
            status: "200",
            body: object.Body?.toString('base64'),
            bodyEncoding: 'base64',
            headers: {
                ...res.headers,
                'content-type': [{ key: 'Content-Type', value: convertImageTypeToMIME(object.$response.httpResponse.headers["content-type"]) }],
            }
        }
    } else {
        return {
            ...res,
            headers: {
                ...res.headers,
                'content-type': [{ key: 'Content-Type', value: convertImageTypeToMIME(res.headers["content-type"][0].value) }],
            }
        }
    }
}

const convertImageTypeToMIME = (contentType) => {
    contentType = contentType.toLocaleLowerCase()

    switch (contentType) {
        case "image/jpg":
            return "image/jpeg"
        default:
            return contentType
    }

} 
