"use client";

import { useRef, useState } from "react";
import { validateContact, type ContactErrors } from "@/lib/contactForm";

const field =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold";
const label = "mb-1.5 block text-sm font-medium text-gray-700";
const problem = "mt-1.5 text-sm text-red-600";

type Status = "idle" | "sending" | "sent";

// The message goes to /api/contact, which puts it in the shop's Wix inbox.
const ContactForm = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [failure, setFailure] = useState("");
  const form = useRef<HTMLFormElement>(null);

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    const data = new FormData(event.currentTarget);
    // The same checks the server makes, so a mistake is shown at once and nothing is sent.
    const checked = validateContact({ name: data.get("name"), email: data.get("email"), message: data.get("message") });
    if (!checked.ok) {
      setErrors(checked.errors);
      setFailure("");
      const first = (["name", "email", "message"] as const).find((key) => checked.errors[key]);
      if (first) document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    setErrors({});
    setFailure("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });
      const answer = await response.json().catch(() => ({}));
      if (response.ok) {
        form.current?.reset();
        setStatus("sent");
        return;
      }
      setStatus("idle");
      if (answer?.errors) setErrors(answer.errors);
      setFailure(
        answer?.error ??
          (response.status === 429
            ? "Too many messages. Please wait a minute and try again."
            : "We could not send your message. Please message us on WhatsApp or call us instead.")
      );
    } catch {
      setStatus("idle");
      setFailure("We could not reach the shop. Check your internet connection and try again.");
    }
  };

  return (
    <form ref={form} onSubmit={send} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="contact-name" className={label}>
          Your name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          placeholder="Jane Wanjiru"
          className={field}
        />
        {errors.name && (
          <p id="contact-name-error" className={problem}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className={label}>
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          placeholder="you@example.com"
          className={field}
        />
        {errors.email && (
          <p id="contact-email-error" className={problem}>
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className={label}>
          Your message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          maxLength={2000}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          placeholder="Tell us which watch or gift you are asking about."
          className={`${field} resize-y`}
        />
        {errors.message && (
          <p id="contact-message-error" className={problem}>
            {errors.message}
          </p>
        )}
      </div>

      {/* A box people never see. Only a bot fills it in, and its message is thrown away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Leave this empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="min-h-12 rounded-lg bg-brand-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-gold hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
      >
        {status === "sending" ? "Sending..." : "Send message"}
      </button>

      {failure && (
        <p role="alert" className="text-sm text-red-600">
          {failure}
        </p>
      )}
      {status === "sent" && (
        <p role="status" className="text-sm text-green-700">
          Thank you. We have your message and will reply to your email soon.
        </p>
      )}
    </form>
  );
};

export default ContactForm;
