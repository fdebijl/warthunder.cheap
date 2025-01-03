const FULL_CAPS_NATIONS = ['usa', 'ussr'];

export const capitalize = (str) => {
  if (!str) return '';

  const lower = str.toLowerCase();

  if (FULL_CAPS_NATIONS.includes(lower)) {
    return lower.toUpperCase();
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}
