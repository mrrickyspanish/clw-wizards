// Opening a private document (birth certificate, USA card) in a new tab.
//
// The file's link is short-lived and has to be fetched from the server first.
// Safari on iPhone and iPad blocks a tab opened after that wait, because it no
// longer counts as the tap that asked for it, so the View button did nothing
// there. The tab is opened during the tap and pointed at the file once the
// link arrives. If the browser refuses the tab, the file opens in this one.

export type DocumentUrlResult = { ok: true; url: string } | { ok: false; error: string }

/** Returns an error message to show, or null when the file was opened. */
export async function openDocument(getUrl: () => Promise<DocumentUrlResult>): Promise<string | null> {
  const tab = window.open('', '_blank')
  let result: DocumentUrlResult
  try {
    result = await getUrl()
  } catch {
    result = { ok: false, error: 'Could not open the file. Try again.' }
  }
  if (!result.ok) {
    tab?.close()
    return result.error
  }
  if (tab) {
    tab.opener = null
    tab.location.href = result.url
  } else {
    window.location.href = result.url
  }
  return null
}

// Saving a private document to the device. The link carries a "save as"
// header (Supabase's download option), so pointing this tab at it saves the
// file and the page stays where it is. No new tab, so nothing for Safari to
// block after the wait.

/** Returns an error message to show, or null when the download started. */
export async function downloadDocument(getUrl: () => Promise<DocumentUrlResult>): Promise<string | null> {
  let result: DocumentUrlResult
  try {
    result = await getUrl()
  } catch {
    result = { ok: false, error: 'Could not download the file. Try again.' }
  }
  if (!result.ok) return result.error
  window.location.assign(result.url)
  return null
}
