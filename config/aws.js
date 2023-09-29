/* eslint-disable no-undef */
const { S3Client, PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3')

module.exports = {
	client: new S3Client({
		region: 'ap-south-1',
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		},
	}),
	PutObjectCommand,
	DeleteObjectsCommand,
}
