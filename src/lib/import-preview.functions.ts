/**
 * Google Drive public-file fetch — thin proxy to PHP `/api/admin/drive/fetch`.
 * Batch 6 migration.
 */
import { driveApi } from "@/lib/api-client";

export async function fetchPublicDriveFile(args: {
  data: { url: string };
}): Promise<{ fileId: string; contentType: string; size: number; base64: string }> {
  return driveApi.fetch(args.data.url);
}
