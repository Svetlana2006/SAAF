#!/usr/bin/env node
/* Owner-run, no-email provisioning for Admin, CSR, and NGO accounts. */
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { loadEnvConfig } = require("@next/env");

const root = process.cwd();
loadEnvConfig(path.join(root, "apps", "api"));

const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/api/.env.");
  process.exit(1);
}

const authAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const prisma = new PrismaClient();
const prompt = readline.createInterface({ input: stdin, output: stdout });

async function ask(label) {
  return (await prompt.question(label)).trim();
}

function askSecret(label) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal to enter the password safely."));
      return;
    }
    stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = key => {
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Cancelled."));
      } else if (key === "\r" || key === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        if (value.length) {
          value = value.slice(0, -1);
          stdout.write("\b \b");
        }
      } else if (key >= " ") {
        value += key;
        stdout.write("*");
      }
    };
    function cleanup() {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }
    stdin.on("data", onData);
  });
}

async function findUser(email) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await authAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Could not check Supabase accounts: ${error.message}`);
    const found = data.users.find(user => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  throw new Error("Too many Auth users to search safely. Check the account in Supabase and retry.");
}

async function main() {
  console.log("Create an Admin, CSR, or NGO login. This does not send email.");
  const roleInput = (await ask("Role (admin/csr/ngo): ")).toLowerCase();
  if (!["admin", "csr", "ngo"].includes(roleInput)) throw new Error("Choose admin, csr, or ngo.");
  const role = roleInput;
  const email = (await ask("Login email: ")).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

  let organization;
  let ngoDetails;
  let existingNgo;
  if (role === "csr") {
    const existingOrganization = await prisma.csrOrganization.findUnique({ where: { email } });
    if (existingOrganization) throw new Error("A CSR organization already uses this email. Use its existing account or update its membership through the Admin portal.");
    organization = {
      name: await ask("CSR organization name: "),
      contactPerson: await ask("Contact person: "),
      phone: await ask("Organization phone: "),
      registrationNumber: await ask("Registration number (optional): "),
      approvedFundingBudget: Number(await ask("Approved commitment budget (₹): ")),
    };
    if (!organization.name || !organization.contactPerson || !organization.phone) throw new Error("Organization name, contact person, and phone are required.");
    if (!Number.isFinite(organization.approvedFundingBudget) || organization.approvedFundingBudget <= 0 || organization.approvedFundingBudget > 100_000_000) throw new Error("Budget must be greater than ₹0 and no more than ₹10 crore.");
  } else if (role === "ngo") {
    existingNgo = await prisma.ngo.findUnique({ where: { email } });
    ngoDetails = existingNgo ?? {
      name: await ask("NGO name: "),
      contactPerson: await ask("Contact person (optional): "),
      phone: await ask("Organization phone (optional): "),
      address: await ask("Organization address (optional): "),
      expertiseAreas: [],
    };
    if (!ngoDetails.name) throw new Error("NGO name is required.");
    const activeMembership = await prisma.ngoMembership.findFirst({
      where: { loginEmail: email },
    });
    if (activeMembership && (!existingNgo || activeMembership.ngoId !== existingNgo.ngoId)) {
      throw new Error("This email already has an active membership for another NGO.");
    }
  }

  prompt.close();
  const password = await askSecret("Password (minimum 12 characters): ");
  if (password.length < 12) throw new Error("Use a password with at least 12 characters.");
  const confirmation = await askSecret("Confirm password: ");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  const existingUser = await findUser(email);
  if (role === "ngo" && existingUser) {
    const linkedMembership = await prisma.ngoMembership.findFirst({ where: { supabaseUserId: existingUser.id } });
    if (linkedMembership && (!existingNgo || linkedMembership.ngoId !== existingNgo.ngoId)) {
      throw new Error("This account is already linked to another NGO.");
    }
  }
  if (existingUser?.app_metadata?.role && existingUser.app_metadata.role !== role) {
    throw new Error(`This account already has the '${existingUser.app_metadata.role}' role. Refusing to change it to '${role}'.`);
  }
  if (role === "csr" && existingUser) {
    const membership = await prisma.csrMembership.findUnique({ where: { supabaseUserId: existingUser.id } });
    if (membership) throw new Error("This account already has a CSR organization membership.");
  }

  let user = existingUser;
  let createdUser = false;
  if (!user) {
    const { data, error } = await authAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: ["admin", "ngo"].includes(role) ? { role } : {},
    });
    if (error || !data.user) throw new Error(`Could not create the login: ${error?.message ?? "No user returned."}`);
    user = data.user;
    createdUser = true;
  } else if (role === "admin" || role === "ngo") {
    const { data, error } = await authAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      app_metadata: { ...(user.app_metadata ?? {}), role },
    });
    if (error || !data.user) throw new Error(`Could not update the ${role.toUpperCase()} login: ${error?.message ?? "No user returned."}`);
    user = data.user;
  } else {
    const { data, error } = await authAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Could not set the CSR login password: ${error?.message ?? "No user returned."}`);
    user = data.user;
  }

  if (role === "admin") {
    console.log(`Admin login ready for ${email}. Sign in at http://localhost:3004/login.`);
    return;
  }

  if (role === "ngo") {
    let createdNgo = null;
    try {
      const result = await prisma.$transaction(async tx => {
        let ngo = await tx.ngo.findUnique({ where: { email } });
        if (!ngo) {
          ngo = await tx.ngo.create({ data: {
            name: ngoDetails.name,
            contactPerson: ngoDetails.contactPerson || null,
            email,
            phone: ngoDetails.phone || null,
            address: ngoDetails.address || null,
            expertiseAreas: ngoDetails.expertiseAreas ?? [],
          } });
          createdNgo = ngo;
        }

        const linkedMembership = await tx.ngoMembership.findFirst({
          where: { OR: [{ supabaseUserId: user.id }, { loginEmail: email }] },
        });
        if (linkedMembership && linkedMembership.ngoId !== ngo.ngoId) {
          throw new Error("This account is already linked to another NGO.");
        }
        if (linkedMembership) {
          await tx.ngoMembership.update({
            where: { membershipId: linkedMembership.membershipId },
            data: { supabaseUserId: user.id, loginEmail: email, passwordHash: null, isActive: true },
          });
        } else {
          await tx.ngoMembership.create({
            data: { supabaseUserId: user.id, loginEmail: email, ngoId: ngo.ngoId, role: "owner", isActive: true },
          });
        }
        return ngo;
      });
      console.log(`NGO login and organization ready for ${email} (${result.name}). Sign in at http://localhost:3002/login.`);
    } catch (error) {
      if (createdNgo) await prisma.ngo.deleteMany({ where: { ngoId: createdNgo.ngoId } });
      if (createdUser) await authAdmin.auth.admin.deleteUser(user.id);
      throw error;
    }
    return;
  }

  let organizationRow;
  try {
    organizationRow = await prisma.$transaction(async tx => {
      const created = await tx.csrOrganization.create({
        data: {
          ...organization,
          email,
          registrationNumber: organization.registrationNumber || null,
        },
      });
      await tx.csrMembership.create({
        data: { supabaseUserId: user.id, csrOrganizationId: created.csrOrganizationId, role: "owner", isActive: true },
      });
      return created;
    });
    const { error } = await authAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...(user.app_metadata ?? {}), role: "csr" },
    });
    if (error) throw new Error(`Organization created, but CSR role update failed: ${error.message}`);
  } catch (error) {
    if (organizationRow) {
      await prisma.csrMembership.deleteMany({ where: { supabaseUserId: user.id } });
      await prisma.csrOrganization.deleteMany({ where: { csrOrganizationId: organizationRow.csrOrganizationId } });
    }
    if (createdUser) await authAdmin.auth.admin.deleteUser(user.id);
    throw error;
  }
  console.log(`CSR login and organization ready for ${email}. Sign in at http://localhost:3003/login.`);
}

main()
  .catch(error => {
    prompt.close();
    console.error(error instanceof Error ? error.message : "Provisioning failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
