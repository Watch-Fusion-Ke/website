// The contact form on the Contact page. The message is sent to the shop's "Contact form" in Wix Forms, so it lands in the
// Wix inbox with the other submissions, and the visitor's email and name become a Wix contact.
// Docs: https://dev.wix.com/docs/api-reference/crm/forms/form-submissions/create-submission
//       https://dev.wix.com/docs/api-reference/crm/forms/form-schemas/create-form

export const CONTACT_FORM_NAME = "Contact form";
const NAMESPACE = "wix.form_app.form";
const KEEP_FOR = 5 * 60 * 1000;

export type ContactInput = { name: string; email: string; message: string; website?: string };
export type ContactErrors = { name?: string; email?: string; message?: string };
export type ContactDeps = { adminFetch: (path: string, init?: RequestInit) => Promise<Response> };
type Result = { status: number; body: Record<string, unknown> };

export const validateContact = (
  raw: unknown
): { ok: true; values: { name: string; email: string; message: string } } | { ok: false; errors: ContactErrors } => {
  const input = (raw ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const name = text(input.name);
  const email = text(input.email);
  const message = text(input.message).replace(/\r\n/g, "\n");
  const errors: ContactErrors = {};
  if (name.length < 2) errors.name = "Please tell us your name.";
  else if (name.length > 80) errors.name = "That name is too long. Please keep it under 80 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = "Please enter a valid email address, so we can reply.";
  if (message.length < 10) errors.message = "Please write a message of at least 10 characters.";
  else if (message.length > 2000) errors.message = "That message is too long. Please keep it under 2000 characters.";
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values: { name, email, message } };
};

type Field = { identifier?: string; inputOptions?: { target?: string } };
type WixForm = { id?: string; name?: string; formFields?: Field[] };

// The boxes are found by their kind, not by their keys, which Wix makes up when a form is built.
export const targetsFromForm = (form: WixForm): { name: string; email: string; message: string } | null => {
  const target = (identifier: string) => form.formFields?.find((f) => f.identifier === identifier)?.inputOptions?.target;
  const name = target("CONTACTS_FIRST_NAME");
  const email = target("CONTACTS_EMAIL");
  const message = target("TEXT_AREA");
  return name && email && message ? { name, email, message } : null;
};

let known: { at: number; formId: string; targets: { name: string; email: string; message: string } } | null = null;

const findForm = async (deps: ContactDeps) => {
  const list = await deps.adminFetch(`/form-schema-service/v4/forms?namespace=${NAMESPACE}`, { method: "GET" });
  if (!list.ok) throw new Error(`Wix form list failed (${list.status})`);
  const summary = ((await list.json())?.forms as WixForm[] | undefined)?.find((f) => f.name === CONTACT_FORM_NAME);
  if (!summary?.id) return null;
  const full = await deps.adminFetch(`/form-schema-service/v4/forms?namespace=${NAMESPACE}&formIds=${encodeURIComponent(summary.id)}`, { method: "GET" });
  if (!full.ok) throw new Error(`Wix form read failed (${full.status})`);
  const form = ((await full.json())?.forms as WixForm[] | undefined)?.[0];
  const targets = form ? targetsFromForm(form) : null;
  return targets ? { at: Date.now(), formId: summary.id, targets } : null;
};

export const submitContact = async (deps: ContactDeps, raw: unknown, opts: { fresh?: boolean } = {}): Promise<Result> => {
  const trap = (raw as { website?: unknown } | undefined)?.website;
  if (typeof trap === "string" && trap.trim() !== "") return { status: 200, body: { ok: true } }; // only a bot fills the hidden box

  const checked = validateContact(raw);
  if (!checked.ok) return { status: 400, body: { error: "Please check the highlighted boxes.", errors: checked.errors } };

  const unavailable: Result = {
    status: 503,
    body: { error: "The message form is not available right now. Please message us on WhatsApp or call us instead.", unavailable: true },
  };

  try {
    if (opts.fresh || !known || Date.now() - known.at > KEEP_FOR) known = await findForm(deps);
    if (!known) return unavailable;

    const { formId, targets } = known;
    const response = await deps.adminFetch("/form-submission-service/v4/submissions", {
      method: "POST",
      body: JSON.stringify({
        submission: {
          formId,
          submissions: { [targets.name]: checked.values.name, [targets.email]: checked.values.email, [targets.message]: checked.values.message },
        },
      }),
    });
    if (!response.ok) {
      const json = await response.clone().json().catch(() => ({}));
      const code = json?.details?.applicationError?.code ?? (json?.details?.validationError ? "validation" : "");
      const detail = `submit ${response.status}${code ? ` ${String(code).slice(0, 40)}` : ""}`;
      console.error("Contact form: Wix refused the message:", detail);
      known = null; // look the form up again next time, in case it was changed
      return { status: 502, body: { error: "We could not send your message. Please message us on WhatsApp or call us instead.", detail } };
    }
    return { status: 200, body: { ok: true } };
  } catch (err) {
    const detail = (err instanceof Error ? err.message : String(err)).slice(0, 160);
    console.error("Contact form: could not send the message:", detail);
    known = null;
    return { status: 502, body: { error: "We could not send your message. Please message us on WhatsApp or call us instead.", detail } };
  }
};
