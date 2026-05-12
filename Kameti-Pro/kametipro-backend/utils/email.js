const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const CLIENT_URL = process.env.CLIENT_URL || 'https://haider-fa-23-092-sec-b-awt-y2qt.vercel.app';

/**
 * Send a confirmation email to a newly added committee member.
 * Errors are caught and logged — they never crash the add-member flow.
 *
 * @param {object} opts
 * @param {string} opts.memberEmail   - Recipient email address
 * @param {string} opts.memberName    - Member's full name
 * @param {string} opts.committeeName - Name of the committee
 * @param {number} opts.monthlyAmount - Monthly contribution in Rs
 * @param {number} opts.durationMonths - Total duration in months
 * @param {string} opts.ownerName     - Committee owner's name
 */
async function sendMemberAddedEmail({
  memberEmail,
  memberName,
  committeeName,
  monthlyAmount,
  durationMonths,
  ownerName,
}) {
  if (!memberEmail) return; // nothing to send if no email provided
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email.');
    return;
  }

  const subject = `Aap ko "${committeeName}" mein add kar diya gaya hai — KametiPro`;

  const html = `
<!DOCTYPE html>
<html lang="ur">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#16a34a;padding:32px 40px;text-align:center;">
              <div style="font-size:2.5rem;margin-bottom:8px;">🏦</div>
              <h1 style="margin:0;color:#ffffff;font-size:1.4rem;font-weight:700;">
                KametiPro
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:0.9rem;">
                Committee Management Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:1rem;color:#374151;">
                Assalam o Alaikum, <strong style="color:#111827;">${memberName}</strong>!
              </p>
              <p style="margin:0 0 24px;font-size:0.95rem;color:#6b7280;line-height:1.6;">
                Aap ko ek nai committee mein add kar diya gaya hai. Neeche details hain:
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;
                       margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="color:#6b7280;font-size:0.85rem;">Committee</span><br/>
                          <strong style="color:#111827;font-size:1rem;">${committeeName}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="color:#6b7280;font-size:0.85rem;">Monthly Amount</span><br/>
                          <strong style="color:#16a34a;font-size:1rem;">
                            ₨${monthlyAmount.toLocaleString()} / month
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <span style="color:#6b7280;font-size:0.85rem;">Total Duration</span><br/>
                          <strong style="color:#111827;font-size:1rem;">${durationMonths} months</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#6b7280;font-size:0.85rem;">Committee Owner</span><br/>
                          <strong style="color:#111827;font-size:1rem;">${ownerName}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:0.9rem;color:#6b7280;line-height:1.6;">
                KametiPro par login karein ya account banayein apni committee track karne ke liye —
                payments, turn order, aur member details sab ek jagah.
              </p>

              <!-- CTA buttons -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${CLIENT_URL}/login"
                      style="display:inline-block;background:#16a34a;color:#ffffff;
                             text-decoration:none;padding:12px 24px;border-radius:8px;
                             font-weight:700;font-size:0.9rem;">
                      Login Karein →
                    </a>
                  </td>
                  <td>
                    <a href="${CLIENT_URL}/signup"
                      style="display:inline-block;background:#ffffff;color:#16a34a;
                             text-decoration:none;padding:11px 24px;border-radius:8px;
                             font-weight:700;font-size:0.9rem;
                             border:2px solid #16a34a;">
                      Account Banayein
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:0.8rem;color:#9ca3af;line-height:1.5;">
                Yeh email automatically bheja gaya hai. Agar aap ko lagta hai yeh galti se
                mila hai, toh is email ko ignore kar dein.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:0.78rem;color:#9ca3af;">
                © ${new Date().getFullYear()} KametiPro — Committee Management Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await resend.emails.send({
      from:    'KametiPro <onboarding@resend.dev>',
      to:      memberEmail,
      subject,
      html,
    });
    console.log(`[Email] Sent member-added email to ${memberEmail}`);
  } catch (err) {
    // Log but never throw — email failure must not break the add-member flow
    console.error('[Email] Failed to send member-added email:', err?.message || err);
  }
}

module.exports = { sendMemberAddedEmail };
