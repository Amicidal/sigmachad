declare module "@aws-sdk/client-s3" {
  export const S3Client: any;
  export const HeadBucketCommand: any;
  export const CreateBucketCommand: any;
  export const PutObjectCommand: any;
  export const GetObjectCommand: any;
  export const DeleteObjectCommand: any;
  export const ListObjectsV2Command: any;
  export const HeadObjectCommand: any;
}

declare module "@aws-sdk/lib-storage" {
  export const Upload: any;
}

declare module "@google-cloud/storage" {
  export const Storage: any;
}
