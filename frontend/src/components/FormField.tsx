import { forwardRef, InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, Props>(({ label, error, hint, id, ...rest }, ref) => {
  const fieldId = id ?? rest.name;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} ref={ref} aria-describedby={hintId} {...rest} />
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

FormField.displayName = "FormField";
