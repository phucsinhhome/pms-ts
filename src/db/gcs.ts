export const putObject = (object: File, bucket: string, key:string) => {
    let form = new FormData()
    form.append('bucket', bucket)
    form.append('objectKey', key)
    form.append('eventId', crypto.randomUUID().toString())
    form.append('file', object)

    console.info("Save product details")
    const opts = {
        method: 'POST',
        // headers: { 'Content-Type': 'multipart/form-data' },
        body: form
    }
    return fetch(`${process.env.REACT_APP_GCS_SYNCER_ENDPOINT}/object/gcs/write`, opts)
}