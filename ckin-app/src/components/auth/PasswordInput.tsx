"use client";

import { useState } from "react";
import Icon from "@/src/components/ui/Icon";

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  autoComplete,
  placeholder = "Masukkan kata sandi",
  invalid,
  withIcon = true,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  invalid?: boolean;
  withIcon?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`input-wrap has-toggle`}>
      {withIcon && <Icon name="lock" size={17} />}
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        className="input"
        style={withIcon ? undefined : { paddingLeft: 14 }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        className="toggle-visibility"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={17} />
      </button>
    </div>
  );
}
