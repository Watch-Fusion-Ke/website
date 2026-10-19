import { describe, expect, it } from "vitest";
import { CONTACT_FORM_NAME, submitContact, targetsFromForm, validateContact, type ContactDeps } from "@/lib/contactForm";

const form = {
  id: "form-1",
  name: CONTACT_FORM_NAME,
  formFields: [
    { id: "a", identifier: "CONTACTS_FIRST_NAME", fieldType: "INPUT", inputOptions: { target: "name_4b1e" } },
    { id: "b", identifier: "CONTACTS_EMAIL", fieldType: "INPUT", inputOptions: { target: "email_7c2d" } },
    { id: "c", identifier: "TEXT_AREA", fieldType: "INPUT", inputOptions: { target: "message_9a3f" } },
    { id: "d", identifier: "SUBMIT_BUTTON", fieldType: "DISPLAY" },
  ],
};

const good = { name: "Jane Wanjiru", email: "jane@example.com", message: "Do you have the Naviforce green dial in stock?", website: "" };

describe("validateContact", () => {
  it("accepts a normal message and trims it", () => {
    const result = validateContact({ ...good, name: "  Jane  ", message: "  Hello, is this watch available?  " });
    expect(result).toEqual({ ok: true, values: { name: "Jane", email: "jane@example.com", message: "Hello, is this watch available?" } });
  });

  it("asks for each missing or poor part in plain words", () => {
    const result = validateContact({ name: "", email: "nope", message: "hi", website: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toMatch(/name/i);
      expect(result.errors.email).toMatch(/email/i);
      expect(result.errors.message).toMatch(/message/i);
    }
  });

  it("refuses text that is too long, so one message cannot fill the inbox", () => {
    const result = validateContact({ ...good, message: "x".repeat(2001) });
    expect(result.ok).toBe(false);
    expect(validateContact({ ...good, name: "n".repeat(81) }).ok).toBe(false);
    expect(validateContact({ ...good, email: `${"a".repeat(250)}@example.com` }).ok).toBe(false);
  });

  it("does not take anything other than text", () => {
    expect(validateContact({ name: 5, email: {}, message: null, website: "" } as never).ok).toBe(false);
    expect(validateContact(undefined as never).ok).toBe(false);
  });
});

describe("targetsFromForm", () => {
  it("finds the name, email and message boxes by their kind, whatever Wix called them", () => {
    expect(targetsFromForm(form)).toEqual({ name: "name_4b1e", email: "email_7c2d", message: "message_9a3f" });
  });

  it("gives nothing when a box is missing, so a half-built form is never filled in wrongly", () => {
    expect(targetsFromForm({ ...form, formFields: form.formFields.filter((f) => f.identifier !== "TEXT_AREA") })).toBeNull();
    expect(targetsFromForm({ id: "x", name: "y" } as never)).toBeNull();
  });
});

type Call = { path: string; method: string; body?: unknown };

const setup = (opts: { forms?: unknown[]; submitStatus?: number; throws?: boolean } = {}) => {
  const calls: Call[] = [];
  const deps: ContactDeps = {
    adminFetch: async (path, init) => {
      const method = init?.method ?? "GET";
      calls.push({ path, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (opts.throws) throw new Error("Wix admin token request failed (400 invalid_client)");
      if (method === "GET" && path.includes("formIds=")) return new Response(JSON.stringify({ forms: [form] }), { status: 200 });
      if (method === "GET") return new Response(JSON.stringify({ forms: opts.forms ?? [{ id: "form-1", name: CONTACT_FORM_NAME }] }), { status: 200 });
      return new Response(JSON.stringify({ submission: { id: "s1" } }), { status: opts.submitStatus ?? 200 });
    },
  };
  return { deps, calls };
};

describe("submitContact", () => {
  it("sends the message to the shop's Contact form so it reaches the Wix inbox", async () => {
    const { deps, calls } = setup();
    const result = await submitContact(deps, good, { fresh: true });
    expect(result.status).toBe(200);
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.path).toBe("/form-submission-service/v4/submissions");
    expect(post.body).toEqual({
      submission: { formId: "form-1", submissions: { name_4b1e: good.name, email_7c2d: good.email, message_9a3f: good.message } },
    });
  });

  it("says thanks without sending anything when the hidden trap box is filled, which only a bot does", async () => {
    const { deps, calls } = setup();
    const result = await submitContact(deps, { ...good, website: "http://spam.example" }, { fresh: true });
    expect(result.status).toBe(200);
    expect(calls).toEqual([]);
  });

  it("returns what to fix when the message is not valid, and sends nothing", async () => {
    const { deps, calls } = setup();
    const result = await submitContact(deps, { ...good, email: "bad" }, { fresh: true });
    expect(result.status).toBe(400);
    expect(result.body).toHaveProperty("errors.email");
    expect(calls).toEqual([]);
  });

  it("says the form is not available when it does not exist yet, and points to other ways to reach the shop", async () => {
    const { deps, calls } = setup({ forms: [{ id: "x", name: "Something else" }] });
    const result = await submitContact(deps, good, { fresh: true });
    expect(result.status).toBe(503);
    expect(String((result.body as { error: string }).error)).toMatch(/WhatsApp|call/i);
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("reports a refusal from Wix as a problem on the shop's side, with the cause for whoever sets it up", async () => {
    const { deps } = setup({ submitStatus: 400 });
    const result = await submitContact(deps, good, { fresh: true });
    expect(result.status).toBe(502);
    expect((result.body as { detail?: string }).detail).toMatch(/400/);
  });

  it("does not let a failure reaching Wix escape", async () => {
    const { deps } = setup({ throws: true });
    const result = await submitContact(deps, good, { fresh: true });
    expect(result.status).toBe(502);
    expect((result.body as { detail?: string }).detail).toMatch(/invalid_client/);
  });

  it("remembers the form for a few minutes, so each message does not ask Wix to find it again", async () => {
    const { deps, calls } = setup();
    await submitContact(deps, good, { fresh: true });
    const before = calls.length;
    await submitContact(deps, good);
    expect(calls.length - before).toBe(1);
  });
});
