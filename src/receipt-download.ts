import { infrai } from "./infrai.ts";

export type ReceiptRequest = {
  donorId: string;
  receiptDonorId: string;
  paymentState: "paid" | "pending";
  receiptKey: string;
};

const BUCKET = "nonprofit-private-files";

function isAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && /already[ _-]?exists|bucket exists/i.test(error.message);
}

export function canDownloadReceipt(request: ReceiptRequest): boolean {
  return request.paymentState === "paid" && request.donorId === request.receiptDonorId;
}

export async function createReceiptDownload(request: ReceiptRequest): Promise<{ url: string; expiresSeconds: number }> {
  if (!canDownloadReceipt(request)) throw new Error("Receipt is not available for this donor.");
  try {
    await infrai.storage.bucket.create({ name: BUCKET });
  } catch (error) {
    if (!isAlreadyExistsError(error)) throw error;
  }
  const object = await infrai.storage.object.head(BUCKET, request.receiptKey);
  if (!object.found) throw new Error("Receipt file is not ready.");
  const expiresSeconds = 900;
  const signed = await infrai.storage.object.presign(BUCKET, request.receiptKey, {
    op: "get",
    expires_seconds: expiresSeconds,
    response_disposition: "attachment",
  });
  return { url: signed.url, expiresSeconds };
}

if (process.argv[1]?.endsWith("receipt-download.ts")) {
  const request: ReceiptRequest = {
    donorId: process.env.DONOR_ID ?? "donor-1042",
    receiptDonorId: process.env.RECEIPT_DONOR_ID ?? "donor-1042",
    paymentState: "paid",
    receiptKey: process.env.RECEIPT_KEY ?? "receipts/donor-1042.pdf",
  };
  const result = await createReceiptDownload(request);
  console.log(JSON.stringify(result, null, 2));
}
