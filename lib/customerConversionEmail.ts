import "server-only";

import nodemailer from "nodemailer";

type CustomerConversionEmailInput = {
  to: string;
  requesterName: string;
  orgName: string;
  adminEmail: string;
  tempPassword: string;
  loginUrl: string;
  plan: string;
  subscriptionStart: string;
  subscriptionEnd: string;
};

type TenantAccountCreatedEmailInput = {
  to: string;
  fullName: string;
  orgName: string;
  loginEmail: string;
  tempPassword: string;
  loginUrl: string;
  roleName: string;
  department?: string | null;
};

type EmailDeliveryResult = {
  id: string | null;
  sentTo: string;
};

type CustomerConversionEmailResult = EmailDeliveryResult;

type GmailMessageInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export const getCustomerConversionEmailConfigError = () => {
  const user = process.env.GMAIL_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!user || !appPassword) {
    return "Email delivery is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.";
  }

  return "";
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatPlan = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const sendGmailEmail = async ({
  to,
  subject,
  html,
  text,
}: GmailMessageInput): Promise<EmailDeliveryResult> => {
  const configError = getCustomerConversionEmailConfigError();

  if (configError) {
    throw new Error(configError);
  }

  const user = process.env.GMAIL_USER?.trim() ?? "";
  const appPassword = process.env.GMAIL_APP_PASSWORD?.trim() ?? "";
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || "TLC Platform";
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass: appPassword,
    },
  });

  const result = await transporter.sendMail({
    from: `"${fromName.replace(/"/g, "'")}" <${user}>`,
    to,
    subject,
    html,
    text,
  });

  return {
    id: result.messageId || null,
    sentTo: to,
  };
};

const buildCustomerConversionTextEmail = ({
  requesterName,
  orgName,
  adminEmail,
  tempPassword,
  loginUrl,
  plan,
  subscriptionStart,
  subscriptionEnd,
}: CustomerConversionEmailInput) => `Hi ${requesterName},

Your TLC Platform account for ${orgName} is ready.

Login details:
Admin email: ${adminEmail}
Temporary password: ${tempPassword}
Login link: ${loginUrl}

Plan: ${formatPlan(plan)}
Subscription: ${subscriptionStart} to ${subscriptionEnd}

For security, please change the temporary password on first login.

Next steps:
1. Open the login link.
2. Sign in using the admin email and temporary password.
3. Set your new password.
4. Complete onboarding.
5. Start managing accounts, roles, colleges, departments, and academic setup.

TLC Platform`;

const buildCustomerConversionHtmlEmail = (input: CustomerConversionEmailInput) => {
  const requesterName = escapeHtml(input.requesterName);
  const orgName = escapeHtml(input.orgName);
  const adminEmail = escapeHtml(input.adminEmail);
  const tempPassword = escapeHtml(input.tempPassword);
  const loginUrl = escapeHtml(input.loginUrl);
  const plan = escapeHtml(formatPlan(input.plan));
  const subscriptionStart = escapeHtml(input.subscriptionStart);
  const subscriptionEnd = escapeHtml(input.subscriptionEnd);

  return `
    <div style="font-family: Arial, sans-serif; background:#f3f3f1; padding:24px; color:#1f2937;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #d9f2ef;">
        <div style="background:#006b5f; color:#ffffff; padding:22px 24px;">
          <h1 style="margin:0; font-size:22px; line-height:1.25;">Your TLC Platform account is ready</h1>
          <p style="margin:8px 0 0; font-size:14px; color:#d9fffb;">${orgName}</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">Hi ${requesterName},</p>
          <p style="margin:0 0 18px;">Your organization has been converted to a TLC Platform customer. Use the credentials below to sign in and complete onboarding.</p>

          <div style="border:1px solid #c5eeea; border-radius:12px; padding:16px; background:#f8fffe;">
            <p style="margin:0 0 10px; font-size:12px; font-weight:700; text-transform:uppercase; color:#006b5f;">Login details</p>
            <p style="margin:0 0 8px;"><strong>Admin email:</strong> ${adminEmail}</p>
            <p style="margin:0 0 8px;"><strong>Temporary password:</strong> ${tempPassword}</p>
            <p style="margin:0;"><strong>Login link:</strong> <a href="${loginUrl}" style="color:#006b5f;">${loginUrl}</a></p>
          </div>

          <div style="margin-top:16px; border:1px solid #e5e7eb; border-radius:12px; padding:16px;">
            <p style="margin:0 0 8px;"><strong>Plan:</strong> ${plan}</p>
            <p style="margin:0;"><strong>Subscription:</strong> ${subscriptionStart} to ${subscriptionEnd}</p>
          </div>

          <p style="margin:18px 0 0; color:#92400e; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:12px;">
            For security, you will be asked to change the temporary password on first login.
          </p>

          <h2 style="margin:22px 0 10px; font-size:16px;">Next steps</h2>
          <ol style="margin:0; padding-left:20px; line-height:1.7;">
            <li>Open the login link.</li>
            <li>Sign in with the admin email and temporary password.</li>
            <li>Set your new password.</li>
            <li>Complete onboarding.</li>
            <li>Start managing accounts, roles, colleges, departments, and academic setup.</li>
          </ol>
        </div>
      </div>
    </div>
  `;
};

const buildTenantAccountTextEmail = ({
  fullName,
  orgName,
  loginEmail,
  tempPassword,
  loginUrl,
  roleName,
  department,
}: TenantAccountCreatedEmailInput) => `Hi ${fullName},

Your TLC Platform account for ${orgName} has been created.

Login details:
Login email: ${loginEmail}
Temporary password: ${tempPassword}
Login link: ${loginUrl}
Role: ${roleName}
${department ? `Department: ${department}\n` : ""}
For security, please change the temporary password on first login.

TLC Platform`;

const buildTenantAccountHtmlEmail = (input: TenantAccountCreatedEmailInput) => {
  const fullName = escapeHtml(input.fullName);
  const orgName = escapeHtml(input.orgName);
  const loginEmail = escapeHtml(input.loginEmail);
  const tempPassword = escapeHtml(input.tempPassword);
  const loginUrl = escapeHtml(input.loginUrl);
  const roleName = escapeHtml(input.roleName);
  const department = input.department ? escapeHtml(input.department) : "";

  return `
    <div style="font-family: Arial, sans-serif; background:#f3f3f1; padding:24px; color:#1f2937;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #d9f2ef;">
        <div style="background:#006b5f; color:#ffffff; padding:22px 24px;">
          <h1 style="margin:0; font-size:22px; line-height:1.25;">Your TLC Platform account has been created</h1>
          <p style="margin:8px 0 0; font-size:14px; color:#d9fffb;">${orgName}</p>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">Hi ${fullName},</p>
          <p style="margin:0 0 18px;">An institutional account has been created for you. Use the credentials below to sign in.</p>

          <div style="border:1px solid #c5eeea; border-radius:12px; padding:16px; background:#f8fffe;">
            <p style="margin:0 0 10px; font-size:12px; font-weight:700; text-transform:uppercase; color:#006b5f;">Login details</p>
            <p style="margin:0 0 8px;"><strong>Login email:</strong> ${loginEmail}</p>
            <p style="margin:0 0 8px;"><strong>Temporary password:</strong> ${tempPassword}</p>
            <p style="margin:0;"><strong>Login link:</strong> <a href="${loginUrl}" style="color:#006b5f;">${loginUrl}</a></p>
          </div>

          <div style="margin-top:16px; border:1px solid #e5e7eb; border-radius:12px; padding:16px;">
            <p style="margin:0 0 8px;"><strong>Role:</strong> ${roleName}</p>
            ${
              department
                ? `<p style="margin:0;"><strong>Department:</strong> ${department}</p>`
                : `<p style="margin:0;"><strong>Department:</strong> Not assigned</p>`
            }
          </div>

          <p style="margin:18px 0 0; color:#92400e; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:12px;">
            For security, you will be asked to change the temporary password on first login.
          </p>
        </div>
      </div>
    </div>
  `;
};

export async function sendCustomerConversionEmail(
  input: CustomerConversionEmailInput,
): Promise<CustomerConversionEmailResult> {
  return sendGmailEmail({
    to: input.to,
    subject: "Your TLC Platform account is ready",
    html: buildCustomerConversionHtmlEmail(input),
    text: buildCustomerConversionTextEmail(input),
  });
}

export async function sendTenantAccountCreatedEmail(
  input: TenantAccountCreatedEmailInput,
): Promise<EmailDeliveryResult> {
  return sendGmailEmail({
    to: input.to,
    subject: "Your TLC Platform account has been created",
    html: buildTenantAccountHtmlEmail(input),
    text: buildTenantAccountTextEmail(input),
  });
}
