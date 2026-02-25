// Email notifications via Resend
// Set RESEND_API_KEY in environment

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "DANTE ID <notifications@dante.id>";
const APP_URL = process.env.APP_URL || "https://dante.id";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email to:", to);
    return null;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Email send error:", err.message);
    return null;
  }
}

const DELIVERABLE_NAMES = {
  brand_identity: "Brand Identity",
  landing_page: "Landing Page",
  business_plan: "Business Plan",
  growth_strategy: "Growth Strategy",
  personal_brand: "Personal Brand",
  pitch_deck: "Pitch Deck",
  competitor_analysis: "Competitor Analysis",
};

async function notifyDeliverablesComplete(supabase, projectId) {
  try {
    // Get project + user info
    const { data: project } = await supabase
      .from("projects")
      .select("*, user:user_id(email)")
      .eq("id", projectId)
      .single();

    if (!project?.user?.email) return;

    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("type, status")
      .eq("project_id", projectId);

    const completed = (deliverables || []).filter((d) => d.status === "completed");
    const failed = (deliverables || []).filter((d) => d.status === "failed");
    const total = deliverables?.length || 0;

    // Only notify when all are done (completed or failed)
    if (completed.length + failed.length < total) return;

    const companyName = project.company_name || project.full_name || "Your startup";
    const dashboardUrl = `${APP_URL}/dashboard`;

    const completedList = completed
      .map((d) => `<li style="color:#22c55e;">✓ ${DELIVERABLE_NAMES[d.type] || d.type}</li>`)
      .join("");
    const failedList = failed
      .map((d) => `<li style="color:#ef4444;">✗ ${DELIVERABLE_NAMES[d.type] || d.type} (can retry)</li>`)
      .join("");

    const subject = failed.length
      ? `${companyName} — ${completed.length}/${total} deliverables ready`
      : `🚀 ${companyName} — All deliverables ready!`;

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#e5e5e5;">
  <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 8px;">${subject}</h1>
  <p style="color:#a3a3a3;font-size:15px;margin:0 0 24px;">Your AI-generated startup deliverables are ready to review.</p>

  <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:24px;">
    <ul style="list-style:none;padding:0;margin:0;font-size:14px;line-height:2;">
      ${completedList}${failedList}
    </ul>
  </div>

  <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
    View Dashboard →
  </a>

  <p style="color:#525252;font-size:12px;margin-top:32px;">
    You're receiving this because you created a project on <a href="${APP_URL}" style="color:#525252;">dante.id</a>.
  </p>
</div>`;

    await sendEmail({ to: project.user.email, subject, html });
    console.log(`Email sent to ${project.user.email} for project ${projectId}`);
  } catch (err) {
    console.error("Notify deliverables error:", err.message);
  }
}

module.exports = { sendEmail, notifyDeliverablesComplete };
