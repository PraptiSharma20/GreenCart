import User from "../models/User.js";

export function authUserId(reqUser) {
  if (!reqUser) return null;
  return reqUser.id || reqUser._id || null;
}

export async function findUserIdByEmail(email) {
  if (!email?.trim()) return null;
  const trimmed = email.trim();
  const account = await User.findOne({
    email: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  }).select("_id");
  return account?._id || null;
}

/** Resolve GreenCart user for a contact query (stored link or email match). */
export async function resolveQueryRecipientId(query) {
  if (query.user) {
    const linked = await User.findById(query.user).select("_id");
    if (linked) return linked._id;
  }
  return findUserIdByEmail(query.email);
}
