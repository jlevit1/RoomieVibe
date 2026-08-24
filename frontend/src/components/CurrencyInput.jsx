export default function CurrencyInput({ value, onChange, name, min, step, ...rest }) {
  const digits = value === null || value === undefined || value === '' ? '' : String(value).replace(/\D/g, '');
  const displayValue = digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '';

  function handleChange(e) {
    const rawDigits = e.target.value.replace(/\D/g, '');
    onChange({ target: { name, value: rawDigits } });
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      value={displayValue}
      onChange={handleChange}
      {...rest}
    />
  );
}
