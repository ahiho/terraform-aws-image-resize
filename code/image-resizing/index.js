// @ts-check
const { S3 } = require('aws-sdk');
const constant = require('./constant');
const { URL } = require('url');
const sharp = require('sharp');


const config = {
    region: process.env.REGION ? process.env.REGION : 'ap-southeast-1',
    bucketName: process.env.IMAGE_BUCKET_NAME ? process.env.IMAGE_BUCKET_NAME : 'default',
}

exports.handler = async (event) => {
    const s3 = new S3({
        signatureVersion: 'v4',
        region: config.region
    });

    const { getObjectContext, userRequest } = event;
    const { outputRoute, outputToken, inputS3Url } = getObjectContext;

    const parsedUrl = new URL(userRequest.url);

    const key = parsedUrl.pathname.replace(/^\//, '')

    const hasPrefix = key.match(/(.*)(\/[w,h,c,f]\/[0-9])/);
    const keyStructure = hasPrefix || key.match(/([w,h,c,f]\/[0-9])/);
    // THIS matches items with width or height, not both
    const oneDimension = key.match(/([w,h])\/(\d+)\/([m,l,h])\/(.*)\/(.*)/);
    // THIS matches items with both width and height
    const twoDimension = key.match(/([c,f])\/(\d+)x(\d+)\/([m,l,h])\/(.*)\/(.*)/);
    const resizeProperties = getResizeProperties(!!hasPrefix, keyStructure, oneDimension, twoDimension);


    if (resizeProperties) {
        const { resizeMode, width, height, quality, format, name, originalKey } = resizeProperties;

        const originalObject = await s3.getObject({
            Bucket: config.bucketName,
            Key: originalKey,
            ResponseContentType: "arraybuffer"
        }).promise();

        if (!originalObject.Body) {
            return Promise.reject(new Error('Object not found or it is empty'));
        }
        // @ts-ignore
        const resizedImage = await sharp(originalObject.Body)
            .resize({
                width,
                height,
                fit: resizeMode === 'c' ? 'cover' : 'inside',
            })
            .toFormat(format, {
                quality: getResizeQuality(constant.Quality[quality]),
            })
            .toBuffer();


        const contentType = 'image/' + format;

        // put object to s3
        s3.putObject({
            Body: resizedImage,
            Bucket: config.bucketName,
            ContentType: contentType,
            CacheControl: 'max-age=31536000',
            Key: key,
            StorageClass: 'STANDARD',
        }).promise();

        await s3.writeGetObjectResponse({
            RequestRoute: outputRoute,
            RequestToken: outputToken,
            Body: resizedImage,
            ContentType: contentType
        }).promise();
    }
    return { statusCode: 200 };

}


const getResizeQuality = (resizeQuality) => {
    if (resizeQuality === constant.Quality.Low) {
        return 40;
    }
    if (resizeQuality === constant.Quality.Medium) {
        return 60;
    }
    if (resizeQuality === constant.Quality.High) {
        return 80;
    }
    if (resizeQuality === constant.Quality.Best) {
        return 100;
    }
};
const getResizeProperties = (hasPrefix, keyStructure, oneDimension, twoDimension) => {
    if (oneDimension) {
        const resizeMode = oneDimension[1];
        const width = resizeMode === constant.ResizeMode.Width ? parseInt(oneDimension[2]) : undefined;
        const height = resizeMode === constant.ResizeMode.Height ? parseInt(oneDimension[2]) : undefined;
        const quality = oneDimension[2];
        const format = oneDimension[4];
        const name = oneDimension[5];
        const originalKey = hasPrefix && keyStructure ? keyStructure[1] + '/' + name : name;
        return {
            resizeMode,
            width,
            height,
            quality,
            format,
            name,
            originalKey,
        };
    }
    if (twoDimension) {
        const resizeMode = twoDimension[1];
        const width = parseInt(twoDimension[2]);
        const height = parseInt(twoDimension[3]);
        const quality = twoDimension[4];
        const format = twoDimension[5];
        const name = twoDimension[6];
        const originalKey = hasPrefix && keyStructure ? keyStructure[1] + '/' + name : name;
        return {
            resizeMode,
            width,
            height,
            quality,
            format,
            originalKey,
        };
    }


}