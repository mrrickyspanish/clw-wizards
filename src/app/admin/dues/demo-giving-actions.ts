'use server'

import { CHURCH_READ_ONLY, READ_ONLY_MESSAGE } from '@/lib/demo-readonly'

// Church demo only (SBC, Nov 20): "Add giver" shows the Giving Admin's flow.
// The platform can't yet record a gift for someone without a member login,
// and the demo is read-only, so the server answers every save with the
// read-only message. Nowhere else does this action do anything.
export async function addGiverAction(input: { name: string; amount: string; fund: string }): Promise<{ ok: false; error: string }> {
  if (!CHURCH_READ_ONLY) return { ok: false, error: 'Not available.' }
  void input
  return { ok: false, error: READ_ONLY_MESSAGE }
}
