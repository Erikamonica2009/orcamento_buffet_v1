import { forwardRef, InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, Props>(({ label, error, id, ...rest }, ref) => {
  const fieldId = id ?? rest.name;
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} ref={ref} {...rest} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

FormField.displayName = "FormField";
