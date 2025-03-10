export const putObject = (object: File, filename: string, bucket: string, key: string): Promise<Response> => {
    let form = new FormData()
    form.append('bucket', bucket)
    form.append('objectKey', key)
    form.append('eventId', crypto.randomUUID().toString())
    form.append('file', object, filename)

    console.info("Save product details")
    const opts = {
        method: 'POST',
        body: form
    }
    return fetch(`${process.env.REACT_APP_GCS_SYNCER_ENDPOINT}/object/gcs/write`, opts)
}


export const putBlob = (object: Blob, filename: string, bucket: string, key: string): Promise<Response> => {
    let form = new FormData()
    form.append('bucket', bucket)
    form.append('objectKey', key)
    form.append('eventId', crypto.randomUUID().toString())
    form.append('file', object, filename)

    console.info("Save product details")
    const opts = {
        method: 'POST',
        body: form
    }
    return fetch(`${process.env.REACT_APP_GCS_SYNCER_ENDPOINT}/object/gcs/write`, opts)
}

