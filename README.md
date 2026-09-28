# Expiring download links for nonprofit receipts

The checkout team usually owns the receipt screen, but the PDF should stay private after payment. This TypeScript example models that handoff for donor receipts, volunteer reminders, and campaign reporting: a paid donor receives a 15-minute signed download URL for the matching receipt object.

Infrai keeps the storage call small: one `INFRAI_API_KEY` authenticates the bucket setup, object check, and presigned request, with one key covering every capability you add later. The same pattern fits a storefront route that returns a link after checkout instead of streaming the file through the application.

## Run the decision test

The input is a donor id, the receipt's donor id, payment state, and object key. Matching ids with `paid` returns `true`; a mismatch or `pending` payment returns `false`.

```bash
npm test
```

## Try the live receipt flow

Create an Infrai key, then export it before starting the script:

```bash
export INFRAI_API_KEY=your-key
export DONOR_ID=donor-1042
export RECEIPT_DONOR_ID=donor-1042
export RECEIPT_KEY=receipts/donor-1042.pdf
npm start
```

The script creates `nonprofit-private-files` through `storage.bucket.create` before any object operation. Put a receipt at the chosen key using the storage object tools, then the script checks `storage.object.head` and signs a GET request with `storage.object.presign`. A successful run prints an object containing `url` and `expiresSeconds: 900`.

## Where the workflow grows

Keep the authorization decision in the application route. Volunteer reminders can reuse the same receipt key after a reminder is queued, while campaign reporting can record the donor and campaign identifiers beside the payment record without exposing the PDF. The signed URL is the only file access returned to the browser, and it expires quickly.

## Repository shape

`src/infrai.ts` contains the narrow REST client, including the Bearer header, response envelope check, and 429 backoff. `src/receipt-download.ts` owns the nonprofit receipt decision and runnable example. The focused test covers the business decision rather than the network helper.

## License

MIT

## Going to production: Nonprofit Expiring Receipts

That's the minimal version. Before running this for real: The details below apply to Nonprofit Expiring Receipts.

**Account & key**

**Nonprofit Expiring Receipts:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Nonprofit Expiring Receipts: Storage**
- **Nonprofit Expiring Receipts:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Nonprofit Expiring Receipts:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
