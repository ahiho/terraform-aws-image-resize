const { S3 } = require('aws-sdk');

exports.handler = async (event) => {
    const s3 = new S3({
        signatureVersion: 'v4',
        region: 'ap-southeast-1'
    });

    const originalObject = await s3.getObject({
        Bucket: "dk-test-image-bucket-7co5puurbgr5r6oaetxqad9ft6oynaps1b-s3alias",
        Key: "a.png",
        ResponseContentType: "arraybuffer"
    }).promise();

    console.log("object: ", originalObject)
    return { statusCode: 200 };
}

