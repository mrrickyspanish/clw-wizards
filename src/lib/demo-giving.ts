// Church demo (UX scrub, Nov 20): sample fund names for gifts. The demo
// database has no fund column, so each gift gets a fund from its id. Admin and
// member pages use this one helper, so a gift shows the same fund on both.
export const CHURCH_FUNDS = ['Tithe', 'Offering', 'Building Fund', 'Missions']

export function churchFund(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return CHURCH_FUNDS[h % CHURCH_FUNDS.length]
}
