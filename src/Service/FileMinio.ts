import * as minio from "minio";
import { ResultCallback } from 'minio/dist/main/internal/type';

export interface UploadedObject extends minio.UploadedObjectInfo {
    objectURL: string
}

const minioClient = new minio.Client({
    endPoint: process.env.REACT_APP_FILE_SERVICE_ENDPOINT!,
    port: Number(process.env.REACT_APP_FILE_SERVICE_PORT),
    useSSL: Boolean(process.env.REACT_APP_FILE_SERVICE_SSL_ENABLED),
    accessKey: process.env.REACT_APP_FILE_SERVICE_ACCESS_KEY!,
    secretKey: process.env.REACT_APP_FILE_SERVICE_SECRET_KEY!,
})

export function getPresignedLink(bucket: string, key: string, durationInSecond: number, fnCallback: ResultCallback<string>) {
    minioClient.presignedGetObject(bucket, key, durationInSecond, fnCallback)
}

export function getPresignedLinkWithDefaultDuration(bucket: string, key: string, fnCallback: ResultCallback<string>) {
    getPresignedLink(bucket, key, 300, fnCallback)
}

export const putObject = async (file: File, filename: string, bucket: string, key: string) => {
    let opts = {
        method: 'PUT',
        body: file
    }
    const presignedURL = await minioClient.presignedPutObject(bucket, key, 300)
    const result = await fetch(presignedURL, opts)
    if (!result.ok) {
        return null
    }
    return {
        objectURL: `https://${process.env.REACT_APP_FILE_SERVICE_ENDPOINT}/os/${bucket}/${key}`
    } as UploadedObject
}