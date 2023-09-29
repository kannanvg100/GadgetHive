const { client, PutObjectCommand, DeleteObjectsCommand } = require('../config/aws')

// Function to upload multiple files to S3
const uploadToS3 = (path = 'images', ...files) => {
	return Promise.all(
		files.map((file) => {
			return new Promise((resolve, reject) => {
				if (!file) {
					return reject(new Error('No file provided.'))
				}

				const extension = file.originalname.split('.').pop()
				const uniqueSuffix = new Date().toISOString().replace(/[-:.]/g, '')
				const fileKey = `${uniqueSuffix}-${Math.round(Math.random() * 1e9)}.${extension}`

				const params = {
					Bucket: 'gadgethive-s3',
					Key: `${path}/` + fileKey,
					Body: file.buffer,
					ContentType: file.mimetype,
				}

				const putObjectCommand = new PutObjectCommand(params)

				client
					.send(putObjectCommand)
					.then(() => {
						resolve(fileKey)
					})
					.catch((error) => {
						reject(error)
					})
			})
		})
	)
}

// Function to delete a file from S3
const deleteFromS3 = (path = 'images', ...keys) => {
	return new Promise((resolve, reject) => {
		const objectsToDelete = []
		keys.map((key) => {
			objectsToDelete.push({ Key: `${path}/${key}` })
		})

		const deleteParams = {
			Bucket: 'gadgethive-s3',
			Delete: {
				Objects: objectsToDelete,
				Quiet: false,
			},
		}

		const deleteObjectsCommand = new DeleteObjectsCommand(deleteParams)

		client
			.send(deleteObjectsCommand)
			.then(() => {
				resolve('File deleted from S3')
			})
			.catch((error) => {
				reject(error)
			})
	})
}

module.exports = {
	uploadToS3,
	deleteFromS3,
}
