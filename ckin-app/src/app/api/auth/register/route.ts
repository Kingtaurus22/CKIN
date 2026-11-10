import CustomerModel from "@/db/models/CustomerModel";
import { isDuplicateKeyError, isEmailTaken, toPublicAccount } from "@/db/models/AccountModel";
import { fail, handleApiError, ok, readJson } from "@/src/lib/api";
import { registerCustomerSchema } from "@/src/schemas/auth";

/** POST /api/auth/register — daftar akun customer. */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const data = registerCustomerSchema.parse(body);

    if (await isEmailTaken(data.email)) {
      return fail("Email sudah terdaftar. Silakan masuk atau gunakan email lain.", 409);
    }

    const customer = await CustomerModel.create(data);

    return ok({ user: toPublicAccount("customer", customer) }, 201);
  } catch (error) {
    if (isDuplicateKeyError(error, "email")) {
      return fail("Email sudah terdaftar. Silakan masuk atau gunakan email lain.", 409);
    }
    return handleApiError(error, "register-customer");
  }
}
