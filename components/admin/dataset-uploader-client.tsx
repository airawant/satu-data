"use client";

import { DatasetUploader } from "@/components/admin/dataset-uploader";
import { AdminProtectedPage } from "@/components/admin/admin-protected-page";

export function DatasetUploaderClient() {
  return (
    <AdminProtectedPage redirectPath="/admin/upload-dataset">
      <DatasetUploader />
    </AdminProtectedPage>
  );
}
