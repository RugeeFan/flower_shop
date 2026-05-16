import nodemailer, { type Transporter } from "nodemailer";
import { getNotificationEmail } from "./settings.server";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOpts): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@flower.shop";

  if (!transporter) {
    // SMTP not configured — log so dev/test still works without crashing.
    console.log("[email:dev-mode] (SMTP not configured, would send)");
    console.log(`  To:      ${opts.to}`);
    console.log(`  From:    ${from}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Body:    ${opts.text ?? opts.html}`);
    return;
  }

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderEmailPayload {
  orderId: string;
  recipientName: string;
  recipientEmail: string;
  buyerEmail?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  totalAmount: number;
  deliveryFee: number;
  deliveryDate: Date;
  message?: string | null;
  deliveryType: "DELIVERY" | "PICKUP";
  // delivery-specific
  address?: string | null;
  postcode?: string | null;
  deliveryWindowLabel?: string | null;
  // pickup-specific
  pickupLocationLabel?: string | null;
  pickupLocationAddress?: string | null;
  pickupTimeSlotLabel?: string | null;
  items: OrderEmailItem[];
}

export async function sendNewOrderNotification(payload: OrderEmailPayload): Promise<void> {
  // Recipient resolution order:
  //   1. SiteSetting[admin_notification_email] (admin-editable in /admin/settings)
  //   2. process.env.NOTIFICATION_EMAIL (legacy/static fallback)
  //   3. Skip with a warning.
  const dbEmail = (await getNotificationEmail()).trim();
  const to = dbEmail || process.env.NOTIFICATION_EMAIL?.trim() || "";
  if (!to) {
    console.warn("[email] No admin email set (DB or env) — skipping order notification");
    return;
  }

  const itemsRows = payload.items
    .map(
      (i) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.name)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${i.quantity}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">$${i.unitPrice.toFixed(2)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const fulfilmentBlock =
    payload.deliveryType === "PICKUP"
      ? `
        <h3>Store Pickup</h3>
        <p><strong>Location:</strong> ${escapeHtml(payload.pickupLocationLabel ?? "")}<br/>
        <strong>Address:</strong> ${escapeHtml(payload.pickupLocationAddress ?? "")}<br/>
        <strong>Pickup Date:</strong> ${formatDate(payload.deliveryDate)}<br/>
        <strong>Time Slot:</strong> ${escapeHtml(payload.pickupTimeSlotLabel ?? "")}</p>`
      : `
        <h3>Local Delivery</h3>
        <p><strong>Address:</strong> ${escapeHtml(payload.address ?? "")}<br/>
        <strong>Postcode:</strong> ${escapeHtml(payload.postcode ?? "")}<br/>
        <strong>Delivery Date:</strong> ${formatDate(payload.deliveryDate)}<br/>
        <strong>Delivery Window:</strong> ${escapeHtml(payload.deliveryWindowLabel ?? "")}</p>`;

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#222;max-width:640px;margin:0 auto;">
      <h2>New Paid Order</h2>
      <p><strong>Order ID:</strong> ${escapeHtml(payload.orderId)}</p>

      <h3>Recipient</h3>
      <p><strong>Name:</strong> ${escapeHtml(payload.recipientName)}<br/>
      <strong>Email:</strong> ${escapeHtml(payload.recipientEmail)}</p>

      ${payload.buyerEmail || payload.buyerName || payload.buyerPhone
        ? `<h3>Buyer</h3>
           <p>${payload.buyerName ? `<strong>Name:</strong> ${escapeHtml(payload.buyerName)}<br/>` : ""}
              ${payload.buyerEmail ? `<strong>Email:</strong> ${escapeHtml(payload.buyerEmail)}<br/>` : ""}
              ${payload.buyerPhone ? `<strong>Phone:</strong> ${escapeHtml(payload.buyerPhone)}` : ""}</p>`
        : ""}

      ${fulfilmentBlock}

      ${payload.message ? `<h3>Card Message</h3><p>${escapeHtml(payload.message)}</p>` : ""}

      <h3>Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f0ec;">
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Item</th>
            <th style="padding:6px 8px;border:1px solid #ddd;">Qty</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Unit</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      ${payload.deliveryFee > 0
        ? `<p style="margin-top:12px;"><strong>Delivery surcharge:</strong> $${payload.deliveryFee.toFixed(2)}</p>`
        : ""}
      <p style="font-size:18px;margin-top:8px;"><strong>Total Paid:</strong> $${payload.totalAmount.toFixed(2)}</p>
    </div>`;

  await sendEmail({
    to,
    subject: `New order ${payload.orderId} — ${payload.deliveryType === "PICKUP" ? "Store Pickup" : "Delivery"}`,
    html,
    text: stripHtml(html),
  });
}

// Customer-facing order confirmation. Sent to the buyer (not the recipient
// of the flowers) — the person who actually paid wants the receipt.
export async function sendCustomerOrderConfirmation(payload: OrderEmailPayload): Promise<void> {
  const to = payload.buyerEmail?.trim();
  if (!to) {
    console.warn(`[email] Order ${payload.orderId} has no buyer email — skipping customer confirmation`);
    return;
  }

  const subtotal = payload.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const itemsRows = payload.items
    .map(
      (i) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.name)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${i.quantity}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">$${i.unitPrice.toFixed(2)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const fulfilmentBlock =
    payload.deliveryType === "PICKUP"
      ? `
        <h3 style="margin-top:24px;">Store Pickup</h3>
        <p><strong>Location:</strong> ${escapeHtml(payload.pickupLocationLabel ?? "")}<br/>
        <strong>Address:</strong> ${escapeHtml(payload.pickupLocationAddress ?? "")}<br/>
        <strong>Pickup date:</strong> ${formatDate(payload.deliveryDate)}<br/>
        <strong>Time slot:</strong> ${escapeHtml(payload.pickupTimeSlotLabel ?? "")}</p>`
      : `
        <h3 style="margin-top:24px;">Delivery</h3>
        <p><strong>To:</strong> ${escapeHtml(payload.recipientName)}<br/>
        <strong>Address:</strong> ${escapeHtml(payload.address ?? "")}<br/>
        <strong>Postcode:</strong> ${escapeHtml(payload.postcode ?? "")}<br/>
        <strong>Delivery date:</strong> ${formatDate(payload.deliveryDate)}<br/>
        <strong>Window:</strong> ${escapeHtml(payload.deliveryWindowLabel ?? "")}</p>`;

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#222;max-width:640px;margin:0 auto;line-height:1.5;">
      <h2 style="margin-bottom:4px;">Thank you${payload.buyerName ? `, ${escapeHtml(payload.buyerName)}` : ""}.</h2>
      <p style="margin-top:0;color:#666;">We've received your order and will start preparing it shortly.</p>

      <p><strong>Order:</strong> ${escapeHtml(payload.orderId)}<br/>
      <strong>Status:</strong> Paid</p>

      ${fulfilmentBlock}

      ${payload.message ? `<h3 style="margin-top:24px;">Card message</h3><p style="font-style:italic;">"${escapeHtml(payload.message)}"</p>` : ""}

      <h3 style="margin-top:24px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f0ec;">
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Item</th>
            <th style="padding:6px 8px;border:1px solid #ddd;">Qty</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Unit</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <table style="margin-top:12px;margin-left:auto;font-size:14px;">
        <tr><td style="padding:2px 8px;color:#666;">Subtotal</td><td style="padding:2px 0;text-align:right;">$${subtotal.toFixed(2)}</td></tr>
        ${payload.deliveryFee > 0
          ? `<tr><td style="padding:2px 8px;color:#666;">Delivery</td><td style="padding:2px 0;text-align:right;">$${payload.deliveryFee.toFixed(2)}</td></tr>`
          : ""}
        <tr><td style="padding:6px 8px;border-top:1px solid #ddd;font-weight:600;">Total paid</td><td style="padding:6px 0;border-top:1px solid #ddd;text-align:right;font-weight:600;">$${payload.totalAmount.toFixed(2)}</td></tr>
      </table>

      ${payload.buyerPhone
        ? `<p style="margin-top:24px;color:#666;font-size:13px;">If we need to reach you, we'll call ${escapeHtml(payload.buyerPhone)}.</p>`
        : ""}

      <p style="margin-top:32px;color:#999;font-size:12px;">Royal Rose · Sydney</p>
    </div>`;

  await sendEmail({
    to,
    subject: `Order ${payload.orderId} confirmed — Royal Rose`,
    html,
    text: stripHtml(html),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}
