'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { sendTestEmail, type SendTestEmailState } from '@/app/admin/email-previews/actions';

function SubmitButton({ result }: { result: SendTestEmailState }) {
  const { pending } = useFormStatus();
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!result) return;
    setShowResult(true);
    const timer = setTimeout(() => setShowResult(false), 3000);
    return () => clearTimeout(timer);
  }, [result]);

  if (showResult && result) {
    return (
      <span
        className="admin-btn"
        style={{
          display: 'inline-block',
          background: result.ok ? '#3f7a4a' : '#B4573F',
          cursor: 'default',
        }}
      >
        {result.ok ? '✓ ' : '✕ '}
        {result.message}
      </span>
    );
  }

  return (
    <button className="admin-btn secondary" type="submit" disabled={pending} style={{ whiteSpace: 'nowrap' }}>
      {pending ? 'Sending…' : 'Send Test'}
    </button>
  );
}

/** Sends one test email and shows a 3-second inline confirmation (green
 * "Sent!" / red error) right over the button, then reverts to normal —
 * no page navigation, so every other button on the page keeps its own
 * independent state instead of a shared redirect-driven toast. */
export function SendTestEmailButton({ type }: { type: string }) {
  const [result, formAction] = useFormState(sendTestEmail, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="type" value={type} />
      <SubmitButton result={result} />
    </form>
  );
}
