export const romanToNumericalRank = (rank) => {
  if (!rank) return 0;

  const roman = rank.toUpperCase().split(' ')[1];

  const romanMap = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  };

  return romanMap[roman] || 0;
}
