@memento/backup
================

Backup service and storage providers for Memento.

Providers
---------
- Local filesystem (default)
- Amazon S3
  - Uses `@aws-sdk/client-s3` for API access (installed by default)
  - Optionally uses `@aws-sdk/lib-storage` for efficient multipart streaming uploads

Optional S3 upload dependency
-----------------------------
- `@aws-sdk/lib-storage` is declared under `optionalDependencies` and loaded dynamically.
- If it is not installed, the S3 provider still works for non-streaming operations (`writeFile`, `readFile`, etc.).
- Streaming uploads via `createWriteStream` require `@aws-sdk/lib-storage`.

Install to enable streaming uploads:

```
pnpm add -w @aws-sdk/lib-storage
```

At runtime, if streaming is invoked without the optional module available, a clear error is thrown instructing how to install it.

Type re-exports for providers
-----------------------------
To keep provider imports simple, common types are re-exported from `BackupStorageProvider`:

```
import type {
  BackupStorageProvider,
  BackupStorageReadOptions,
  BackupStorageWriteOptions,
} from "./BackupStorageProvider.js";
```

