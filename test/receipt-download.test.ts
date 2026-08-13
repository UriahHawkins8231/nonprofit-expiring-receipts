import assert from "node:assert/strict";
import { canDownloadReceipt } from "../src/receipt-download.ts";

assert.equal(canDownloadReceipt({ donorId: "d-1", receiptDonorId: "d-1", paymentState: "paid", receiptKey: "receipts/d-1.pdf" }), true);
assert.equal(canDownloadReceipt({ donorId: "d-1", receiptDonorId: "d-2", paymentState: "paid", receiptKey: "receipts/d-2.pdf" }), false);
assert.equal(canDownloadReceipt({ donorId: "d-1", receiptDonorId: "d-1", paymentState: "pending", receiptKey: "receipts/d-1.pdf" }), false);
console.log("receipt access decisions passed");
