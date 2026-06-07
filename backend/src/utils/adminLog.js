import AdminLog from "../models/AdminLog.js";

export async function logAdminAction({
  action,
  actor = null,
  targetType = "",
  targetId = "",
  details = "",
}) {
  try {
    await AdminLog.create({
      action,
      actorId: actor?._id || actor?.id || null,
      actorName: actor?.name || "Admin",
      targetType,
      targetId: targetId ? String(targetId) : "",
      details,
    });
  } catch (err) {
    console.warn("Admin log failed:", err?.message || err);
  }
}
