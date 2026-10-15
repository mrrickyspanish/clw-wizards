// What happens to a wrestler's dues when the wrestler is removed on their own.
//
// dues_payments.athlete_id is ON DELETE SET NULL, so a plain delete leaves the
// wrestler's dues on the family's account with no name on them: an unpaid row
// keeps showing as money owed. Rows with no money behind them go with the
// wrestler; rows that carry a payment stay, as the club's payment history.

export type DuesRow = {
  id: string
  amount_paid_cents: number | null
  stripe_payment_intent_id: string | null
}

export function hasMoney(row: DuesRow): boolean {
  return (row.amount_paid_cents ?? 0) > 0 || Boolean(row.stripe_payment_intent_id)
}

export function duesToRemoveWithWrestler(rows: DuesRow[]): string[] {
  return rows.filter((row) => !hasMoney(row)).map((row) => row.id)
}
