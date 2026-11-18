// Optional email notifications via Resend.
//
// Off switch: if RESEND_API_KEY isn't set, nothing is sent and we return "skipped".
// Messages are always saved first, so email problems never block a message.
import { Resend } from "resend";
import type { EmailStatus } from "./types";

type SellerNotification = {
  sellerEmail: string;
  sellerName: string;
  listingTitle: string;
  listingUrl: string;
  buyerEmail: string;
  message: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function notifySeller(n: SellerNotification): Promise<Exclude<EmailStatus, "pending">> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[email] RESEND_API_KEY is not set, so the email was skipped (message still saved).");
    return "skipped";
  }

  // RESEND_DEMO_RECIPIENT sends every notification to one inbox (handy on Resend's free
  // tier, which only delivers to your own address until you verify a domain).
  const demoRecipient = process.env.RESEND_DEMO_RECIPIENT?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Marketplace <onboarding@resend.dev>";
  const to = demoRecipient || n.sellerEmail;

  const subject = `New message about "${n.listingTitle}"`;
  const demoNote = demoRecipient
    ? `<p style="color:#65676b;font-size:13px">Demo mode: originally addressed to ${escapeHtml(n.sellerEmail)}.</p>`
    : "";

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;color:#050505">
      <p style="font-size:20px;font-weight:700;color:#1877f2;margin:0 0 16px">Marketplace</p>
      <p>Hi ${escapeHtml(n.sellerName)},</p>
      <p>Someone sent you a message about <a href="${escapeHtml(n.listingUrl)}" style="color:#1877f2">${escapeHtml(n.listingTitle)}</a>:</p>
      <blockquote style="margin:16px 0;padding:12px 16px;background:#f0f2f5;border-radius:12px;white-space:pre-wrap">${escapeHtml(n.message)}</blockquote>
      <p>Reply to this email to answer them at <strong>${escapeHtml(n.buyerEmail)}</strong>.</p>
      ${demoNote}
    </div>`;

  const text = `Hi ${n.sellerName},\n\nSomeone sent you a message about "${n.listingTitle}" (${n.listingUrl}):\n\n${n.message}\n\nReply to this email to answer them at ${n.buyerEmail}.`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, replyTo: n.buyerEmail, subject, html, text });
    if (error) {
      console.error("[email] Resend rejected the email:", error);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[email] Sending failed:", err);
    return "failed";
  }
}
