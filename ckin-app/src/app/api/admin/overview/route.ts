import AdminModel from "@/db/models/AdminModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/admin/overview — ringkasan untuk dashboard super admin. */
export async function GET() {
  try {
    await requireSession("admin");
    return ok(await AdminModel.overview());
  } catch (error) {
    return handleApiError(error, "admin-overview");
  }
}
