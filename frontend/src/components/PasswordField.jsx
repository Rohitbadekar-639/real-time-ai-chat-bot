import { useState } from "react";

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  placeholder,
  required = true,
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-zinc-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-3 pr-12 text-base text-white outline-none ring-gold/40 placeholder:text-zinc-500 focus-visible:ring-2 sm:text-sm"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 hover:text-white"
          onClick={() => setShow((open) => !open)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <i className={show ? "ri-eye-off-line" : "ri-eye-line"} aria-hidden />
        </button>
      </div>
    </div>
  );
}
