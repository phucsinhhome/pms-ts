import * as minio from "minio";
import { ResultCallback } from 'minio/dist/main/internal/type';

var minioClient = new minio.Client({
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

// export const uploadBlob = (bucket: string, key: string, blob: BlobPart, filename: string) => {
//     var file = new File([blob], filename);
//     var fs = Fs.createReadStream(file);
//     return minioClient.putObject(bucket, key, fs, file.size);
// }

export const uploadBlobToPresignedURL = (bucket: string, key: string, blob: Blob, filename: string) => {
    var file = new File([blob], filename)
    let opts = {
        method: 'PUT',
        body: file
    }
    return minioClient.presignedPutObject(bucket, key, 300)
        .then((url) => fetch(url, opts))
}