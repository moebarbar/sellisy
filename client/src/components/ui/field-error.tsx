// Inline field-level error message. Pair with aria-invalid +
// aria-describedby on the input so screen readers announce the error:
//
//   <Input aria-invalid={!!errors.slug} aria-describedby="slug-error" ... />
//   <FieldError id="slug-error" error={errors.slug} />
//
// Toasts stay as a secondary signal for whole-form failures; per-field
// problems should render here, next to the field that caused them.

export function FieldError({ id, error }: { id: string; error?: string | null }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {error}
    </p>
  );
}
