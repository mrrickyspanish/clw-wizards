import { getQstashClient, siteUrl } from '@/lib/qstash'
import type { BlastRequestBody } from '@/app/api/comms/blast/route'

export async function enqueueCommsJob(payload: BlastRequestBody) {
  await getQstashClient().publishJSON({
    url: `${siteUrl()}/api/comms/blast-job`,
    body: payload,
  })
}
