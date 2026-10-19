"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { passwordStrength } from "@/lib/auth";

export const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold";
export const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

const BAR = ["bg-gray-200", "bg-red-500", "bg-amber-500", "bg-green-600", "bg-green-600"];

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showStrength = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  showStrength?: boolean;
}) => {
  const [shown, setShown] = useState(false);
  const strength = passwordStrength(value);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Enter your password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} pr-12`}
        />
        <button
          type="button"
          aria-pressed={shown}
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown((s) => !s)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          {shown ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>

      {showStrength && value !== "" && (
        <div className="mt-3">
          <div
            role="progressbar"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={strength.score}
            aria-valuetext={strength.label}
            className="flex gap-1"
          >
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1.5 flex-1 rounded-full ${step <= strength.score ? BAR[strength.score] : "bg-gray-200"}`}
              />
            ))}
          </div>
          <p aria-live="polite" className="mt-1.5 text-sm font-medium text-gray-700">
            {strength.label}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
            {strength.rules.map((rule) => (
              <li key={rule.label} data-ok={rule.ok} className={rule.ok ? "text-green-700" : ""}>
                <span aria-hidden="true">{rule.ok ? "✓ " : "• "}</span>
                {rule.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordField;
