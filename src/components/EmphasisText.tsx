import { Fragment } from 'react';

/**
 * Renders text with *single-asterisk* spans as <em>, matching the original
 * hero markup's `<em>actually</em>` gold-italic treatment while letting
 * admins edit the heading as plain text in the CMS (e.g. "the business
 * you're *actually* running").
 */
export function EmphasisText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
