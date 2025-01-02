export const containsNonLatinCharacters = (input: string): boolean => {
  // eslint-disable-next-line no-control-regex
  const nonLatinRegex = /[^\u0000-\u007F\u0100-\u024F\s.,;:'"\-()[\]{}!?0-9/]/;

  return nonLatinRegex.test(input);
}
