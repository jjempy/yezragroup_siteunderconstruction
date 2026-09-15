// Answers the searches (and AI-chat questions) of someone who feels the
// exact thing this business solves but doesn't have the vocabulary for
// it yet — "why does my business feel stuck," "how do I know if I have
// a blind spot," etc. Written in the same understated, no-hype register
// as the rest of the site. Static for now (not CMS-driven) since it's
// closer to structural/legal-adjacent copy than content that changes
// often — revisit if it needs to change more than a couple times a year.
const FAQ_ITEMS = [
  {
    q: "Why does my business feel stuck even though I'm working harder than ever?",
    a: "Usually it's not a new problem — it's an old one nobody's said out loud, including to yourself. That's what the free masterclass is built around: not another tactic, but the one thing you've been quietly working around instead of through.",
  },
  {
    q: "How do I know if my business has a blind spot I can't see on my own?",
    a: "Mostly, you can't — that's what makes it a blind spot. A rough test: if you can't remember the last time someone who isn't on your payroll told you something about your business you didn't want to hear, that's usually the sign.",
  },
  {
    q: "Something feels off but I can't pinpoint it — where do I even start?",
    a: "Start with the free masterclass. It's built around exactly that feeling — twenty minutes of real content, then working through it together, live. No pitch before you've gotten something real out of it.",
  },
  {
    q: 'Is this only for businesses that are struggling?',
    a: "No — most people in the room are doing fine on paper. The more common pattern is a business that's working despite something, not because everything's actually dialed in. That's a different problem than failing, and it needs a different kind of honesty to fix.",
  },
  {
    q: "What's the actual difference between this and a typical business coach?",
    a: 'No framework to sell at the free session, no 12-month program pitch. What gets taught is testimony — what actually happened, not theory about what should work. The paid tiers exist because some of this genuinely takes more time than a free session allows, not because the free content is a teaser.',
  },
  {
    q: 'Do I need to already know what I want to fix before I attend?',
    a: "No. Most people who get the most out of it didn't come in with a specific question — they came in willing to hear something they hadn't considered.",
  },
  {
    q: 'Is the Workshop Library different from the free masterclass videos?',
    a: "Yes. The free videos on this site are the edited public recap of each session. The Workshop Library is the longer, less-edited cut of the same sessions — the parts that don't make the public version — for a one-time $147.",
  },
  {
    q: 'What size or type of business is this actually built for?',
    a: "Owner-operators and small teams, where the person running the business is still close enough to every decision that a blind spot actually costs something. If you're several layers removed from the day-to-day, this probably isn't the right fit.",
  },
];

export function Faq() {
  return (
    <section className="light" id="faq">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Common Questions</div>
          <h2>If something&apos;s nagging at you, start here.</h2>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details className="faq-item reveal in" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export { FAQ_ITEMS };
