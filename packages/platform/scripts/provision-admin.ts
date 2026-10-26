/**
 * CLI utility to provision an administrator account.
 * Accounts are provisioned by the project owner using server-only service-role credentials.
 * There is NO public registration endpoint for Admin or CSR accounts.
 *
 * Usage:
 *   npx ts-node packages/platform/scripts/provision-admin.ts <email> [password]
 */
import { createAdminClient } from "../src/supabase/admin";

async function provisionAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email) {
    console.error("Usage: npx ts-node packages/platform/scripts/provision-admin.ts <email> [password]");
    process.exit(1);
  }

  const admin = createAdminClient();

  // Check if user already exists
  const { data: listData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to query Supabase users:", listError.message);
    process.exit(1);
  }

  let user = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (user) {
    console.log(`User ${email} found (${user.id}). Updating role to 'admin'...`);
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...(user.app_metadata ?? {}), role: "admin" },
      ...(password ? { password } : {}),
    });
    if (updateError) {
      console.error("Failed to update user role:", updateError.message);
      process.exit(1);
    }
    console.log(`✅ User ${email} updated with app_metadata.role = 'admin'`);
  } else {
    if (password) {
      console.log(`Creating new user ${email} with password and role 'admin'...`);
      const { data, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "admin" },
      });
      if (createError || !data.user) {
        console.error("Failed to create user:", createError?.message);
        process.exit(1);
      }
      console.log(`✅ Administrator account created: ${email} (${data.user.id})`);
    } else {
      console.log(`Sending invitation email to ${email} with role 'admin'...`);
      const adminPortalUrl = process.env.ADMIN_PORTAL_URL ?? "http://localhost:3004";
      const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { role: "admin" },
        redirectTo: new URL("/auth/callback?next=%2Fauth%2Fset-password", adminPortalUrl).toString(),
      });
      if (inviteError || !data.user) {
        console.error("Failed to send invite:", inviteError?.message);
        process.exit(1);
      }
      await admin.auth.admin.updateUserById(data.user.id, {
        app_metadata: { ...(data.user.app_metadata ?? {}), role: "admin" },
      });
      console.log(`✅ Administrator invitation sent to ${email}`);
    }
  }
}

provisionAdmin().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

