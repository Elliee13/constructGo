export const formatPrice = (value: number) => {
  const fixed = value.toFixed(2);
  const [whole, fraction] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₱ ${withCommas}.${fraction}`;
};
