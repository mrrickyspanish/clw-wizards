-- Groups the per-recipient rows communication_log already writes into
-- distinct sends. Every row from one compose-form submission (or one cron
-- firing) shares a blast_id, generated once in blast-job/route.ts and passed
-- to every sendCommEmail/sendSms call in that run.
--
-- Existing rows predate this column and stay NULL -- there is no way to
-- reconstruct which historical rows belonged to the same send, and grouping
-- them by a guess (same subject + sent within a few seconds) would risk
-- merging two different blasts that happened to run back to back. NULL rows
-- are surfaced in the admin history view as "before send tracking" rather
-- than silently grouped.
ALTER TABLE public.communication_log
  ADD COLUMN blast_id UUID;

COMMENT ON COLUMN public.communication_log.blast_id IS
  'Groups rows from one compose-form send or one cron firing. NULL on rows written before this column existed.';

-- Blast history dashboard: aggregate by blast_id.
CREATE INDEX idx_communication_log_blast_id
  ON public.communication_log (blast_id, sent_at DESC)
  WHERE blast_id IS NOT NULL;

-- Per-family message history: recipient's own timeline, newest first.
CREATE INDEX idx_communication_log_recipient
  ON public.communication_log (recipient_id, sent_at DESC)
  WHERE recipient_id IS NOT NULL;
