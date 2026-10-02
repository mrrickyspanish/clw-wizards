/**
 * Whether two entries are the same child within one family: the same first
 * and last name, ignoring case, spaces, punctuation and accents. So
 * "Tre'Lyn" matches "TreLyn", "Mc Knight" matches "McKnight" and "José"
 * matches "Jose". Birth dates are left out on purpose -- the imported roster
 * had wrong ones, which is how duplicates got through before. Nicknames
 * ("Ceci" for "Cecilia") are different names and still need a person.
 *
 * Shared by family setup (server and form) and Add a wrestler, so all three
 * agree on what counts as already on file.
 */
export function sameChildKey(firstName: string, lastName: string): string {
  const part = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, '')
  return `${part(firstName)}|${part(lastName)}`
}
