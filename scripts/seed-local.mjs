#!/usr/bin/env node
// Seedet lokale D1 mit ein paar Beispiel-Mails (raw_eml als BLOB), damit man die UI sofort sieht.
// Usage:   npm run seed -- [inbox-adresse]
// Default: demo@temp.zauberware.org
import { execSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";

const inbox = (process.argv[2] || "demo@temp.zauberware.org").toLowerCase();
const [, domain] = inbox.split("@");
if (!domain) {
  console.error("Ungültige Inbox-Adresse:", inbox);
  process.exit(1);
}

const now = Date.now();
const tmp = mkdtempSync(join(tmpdir(), "tempmail-seed-"));

function buildEml({ from, to, subject, date, parts }) {
  // parts: [{ headers: {...}, body: string|Buffer }]
  const boundary = "----b" + Math.random().toString(36).slice(2);
  const headerLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${new Date(date).toUTCString()}`,
    `Message-ID: <${ulid()}@tempmail.local>`,
    `MIME-Version: 1.0`,
  ];
  if (parts.length === 1) {
    headerLines.push(...Object.entries(parts[0].headers).map(([k, v]) => `${k}: ${v}`));
    return headerLines.join("\r\n") + "\r\n\r\n" + parts[0].body;
  }
  headerLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  let body = `This is a multi-part message.\r\n\r\n`;
  for (const p of parts) {
    body += `--${boundary}\r\n`;
    body +=
      Object.entries(p.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n") + "\r\n\r\n";
    body += p.body + "\r\n";
  }
  body += `--${boundary}--\r\n`;
  return headerLines.join("\r\n") + "\r\n\r\n" + body;
}

function altBody(text, html) {
  const boundary = "----alt" + Math.random().toString(36).slice(2);
  let body = `This is a multi-part alternative.\r\n\r\n`;
  body += `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${text}\r\n`;
  body += `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${html}\r\n`;
  body += `--${boundary}--\r\n`;
  return {
    headers: { "Content-Type": `multipart/alternative; boundary="${boundary}"` },
    body,
  };
}

// 1×1 transparent PNG in base64
const PNG_1x1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// Minimal "fake PDF" bytes (postal-mime parst es nicht echt, nur als Attachment listen)
const FAKE_PDF_B64 = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Count 0>>endobj\n" +
    "xref\n0 3\n0000000000 65535 f\n0000000009 00000 n\n0000000050 00000 n\n" +
    "trailer<</Size 3/Root 1 0 R>>\nstartxref\n92\n%%EOF\n",
).toString("base64");

function b64Wrap(b64) {
  // 76 chars per line, RFC 2045
  return b64.match(/.{1,76}/g).join("\r\n");
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const mails = [
  // 1) GitHub verify — HTML + text (multipart/alternative)
  {
    from: "GitHub <noreply@github.com>",
    fromAddr: "noreply@github.com",
    fromName: "GitHub",
    subject: "[GitHub] Please verify your email address",
    receivedAt: now - 3 * MIN,
    build: (to, date, subject) =>
      buildEml({
        from: "GitHub <noreply@github.com>",
        to,
        subject,
        date,
        parts: [
          altBody(
            `Hi simon,\n\nPlease verify your email address by clicking the link below:\n\nhttps://github.com/users/verify/abc123def456\n\nThanks,\nThe GitHub Team`,
            `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;margin:0;padding:20px;background:#f6f8fa;color:#1f2328"><div style="max-width:480px;margin:0 auto;background:white;border:1px solid #d0d7de;border-radius:6px;padding:32px"><h2 style="margin:0 0 16px 0;font-size:20px;border-bottom:1px solid #d0d7de;padding-bottom:12px">Verify your email address</h2><p>Hey <b>simon</b>,</p><p>Please click the button below to verify your email address.</p><p style="text-align:center;margin:32px 0"><a href="https://github.com/users/verify/abc123" style="background:#1f883d;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600">Verify email address</a></p><p style="font-size:12px;color:#656d76;border-top:1px solid #d0d7de;padding-top:16px;margin-top:32px">If you didn't request this, you can safely ignore this email.</p></div></body></html>`,
          ),
        ],
      }),
  },

  // 2) Stripe invoice with PDF attachment
  {
    from: "Stripe <invoices+receipts@stripe.com>",
    fromAddr: "invoices+receipts@stripe.com",
    fromName: "Stripe",
    subject: "Your receipt from Acme GmbH [#1042-9876]",
    receivedAt: now - 47 * MIN,
    build: (to, date, subject) =>
      buildEml({
        from: "Stripe <invoices+receipts@stripe.com>",
        to,
        subject,
        date,
        parts: [
          altBody(
            `Receipt from Acme GmbH\n\nAmount: EUR 42.00\nInvoice: INV-2026-0042\nDate: ${new Date(date).toLocaleDateString()}\n\nA PDF copy is attached.`,
            `<!doctype html><html><body style="font-family:-apple-system,system-ui,sans-serif;margin:0;padding:24px;background:#f6f9fc;color:#3c4257"><div style="max-width:560px;margin:auto;background:white;padding:32px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><div style="font-size:14px;color:#697386;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Receipt from Acme GmbH</div><div style="font-size:32px;font-weight:600;margin-bottom:24px">€42.00</div><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:8px 0;color:#697386">Invoice number</td><td style="text-align:right;font-family:monospace">INV-2026-0042</td></tr><tr><td style="padding:8px 0;color:#697386">Date paid</td><td style="text-align:right">${new Date(date).toLocaleDateString()}</td></tr><tr><td style="padding:8px 0;color:#697386">Payment method</td><td style="text-align:right">Visa •••• 4242</td></tr></table><p style="margin-top:24px;font-size:13px;color:#697386">A PDF copy is attached to this email.</p></div></body></html>`,
          ),
          {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="invoice-INV-2026-0042.pdf"`,
              "Content-Transfer-Encoding": "base64",
            },
            body: b64Wrap(FAKE_PDF_B64),
          },
        ],
      }),
  },

  // 3) SaaS login code (plain text only)
  {
    from: "Linear <support@linear.app>",
    fromAddr: "support@linear.app",
    fromName: "Linear",
    subject: "Your login code: 472-918",
    receivedAt: now - 2 * HOUR,
    build: (to, date, subject) =>
      buildEml({
        from: "Linear <support@linear.app>",
        to,
        subject,
        date,
        parts: [
          {
            headers: {
              "Content-Type": "text/plain; charset=UTF-8",
              "Content-Transfer-Encoding": "8bit",
            },
            body: `Your one-time login code is:\n\n  472-918\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.\n\n— Linear`,
          },
        ],
      }),
  },

  // 4) Newsletter with REMOTE images (rendering test case)
  {
    from: "Product Hunt Daily <hello@producthunt.com>",
    fromAddr: "hello@producthunt.com",
    fromName: "Product Hunt Daily",
    subject: "🚀 Today's top launches: AI dev tools galore",
    receivedAt: now - 5 * HOUR,
    build: (to, date, subject) =>
      buildEml({
        from: "Product Hunt Daily <hello@producthunt.com>",
        to,
        subject,
        date,
        parts: [
          altBody(
            `Today on Product Hunt:\n\n1. CodeCompanion — AI pair programmer\n2. DocsGPT — Search any documentation\n3. Refly — Visual AI workflows\n\nView all → https://producthunt.com\n`,
            `<!doctype html><html><body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,system-ui,sans-serif"><div style="max-width:600px;margin:auto;background:white"><div style="background:#da552f;padding:24px;text-align:center"><img src="https://ph-static.imgix.net/ph-logo-1.png" alt="PH" width="40" style="display:inline-block"><div style="color:white;font-size:14px;letter-spacing:1px;margin-top:8px">DAILY DIGEST</div></div><div style="padding:24px"><h2 style="margin:0 0 16px 0">Today's top launches</h2><div style="border:1px solid #eee;border-radius:8px;padding:16px;margin-bottom:12px"><img src="https://ph-files.imgix.net/codecompanion.png" alt="CodeCompanion" width="60" style="float:left;margin-right:12px;border-radius:8px"><h3 style="margin:0 0 4px 0">CodeCompanion</h3><p style="margin:0;color:#666;font-size:14px">AI pair programmer in your terminal</p><div style="clear:both"></div></div><div style="border:1px solid #eee;border-radius:8px;padding:16px;margin-bottom:12px"><img src="https://ph-files.imgix.net/docsgpt.png" alt="DocsGPT" width="60" style="float:left;margin-right:12px;border-radius:8px"><h3 style="margin:0 0 4px 0">DocsGPT</h3><p style="margin:0;color:#666;font-size:14px">Search any documentation with AI</p><div style="clear:both"></div></div><p style="text-align:center;margin:24px 0"><a href="https://producthunt.com" style="background:#da552f;color:white;padding:10px 24px;text-decoration:none;border-radius:6px">View all launches</a></p></div><div style="background:#f5f5f5;padding:16px;text-align:center;font-size:12px;color:#999">You're receiving this because you signed up for Product Hunt Daily.</div></div></body></html>`,
          ),
        ],
      }),
  },

  // 5) Email with PNG attachment
  {
    from: "Anna <anna@example.com>",
    fromAddr: "anna@example.com",
    fromName: "Anna",
    subject: "Look at this cute pixel 🐾",
    receivedAt: now - 1 * DAY,
    build: (to, date, subject) =>
      buildEml({
        from: "Anna <anna@example.com>",
        to,
        subject,
        date,
        parts: [
          {
            headers: {
              "Content-Type": "text/plain; charset=UTF-8",
              "Content-Transfer-Encoding": "8bit",
            },
            body: `Hey,\n\nLook at the attached image. Tiny but mighty.\n\nLG, Anna`,
          },
          {
            headers: {
              "Content-Type": "image/png",
              "Content-Disposition": `attachment; filename="pixel.png"`,
              "Content-Transfer-Encoding": "base64",
            },
            body: b64Wrap(PNG_1x1),
          },
        ],
      }),
  },
];

// SQL für inbox + messages bauen
const sqlEsc = (v) =>
  v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;

const toHex = (buf) => "X'" + Buffer.from(buf).toString("hex").toUpperCase() + "'";

const inserts = [
  `INSERT INTO inboxes (address, created_at, last_seen_at, owner_token)
   VALUES (${sqlEsc(inbox)}, ${now}, ${now}, ${sqlEsc("seed-" + ulid())})
   ON CONFLICT(address) DO UPDATE SET last_seen_at = excluded.last_seen_at;`,
];

for (const m of mails) {
  const id = ulid();
  const eml = m.build(inbox, m.receivedAt, m.subject);

  let preview = "";
  const textMatch = eml.match(
    /Content-Type:\s*text\/plain[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|\r?\n$)/i,
  );
  if (textMatch) preview = textMatch[1].trim().slice(0, 500);

  const hasAttachments = /Content-Disposition:\s*attachment/i.test(eml) ? 1 : 0;
  const size = Buffer.byteLength(eml, "utf8");
  const rawHex = toHex(Buffer.from(eml, "utf8"));

  inserts.push(
    `INSERT INTO messages (id, inbox_address, from_addr, from_name, subject, received_at, size_bytes, has_attachments, raw_eml, text_preview)
     VALUES (${sqlEsc(id)}, ${sqlEsc(inbox)}, ${sqlEsc(m.fromAddr)}, ${sqlEsc(m.fromName)}, ${sqlEsc(m.subject)},
             ${m.receivedAt}, ${size}, ${hasAttachments}, ${rawHex}, ${sqlEsc(preview)});`,
  );
}

const sqlFile = join(tmp, "seed.sql");
writeFileSync(sqlFile, inserts.join("\n"), "utf8");

console.log(`→ seede Inbox: ${inbox}`);
console.log(`→ ${mails.length} Test-Mails`);

try {
  console.log("\n[1/1] D1 (lokal) schreiben …");
  execSync(`npx wrangler d1 execute tempmail --local --file=${sqlFile}`, {
    stdio: "inherit",
  });

  console.log("\n✅ fertig. Im Browser:");
  console.log(`   → http://localhost:8787`);
  console.log(`   → in der Address-Bar oben "${inbox.split("@")[0]}" eingeben`);
  console.log(`   → @ ${domain} wählen → Übernehmen`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
