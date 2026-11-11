export interface NoticeInput {
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  matter: string;
  facts: string;
  relief: string;
  act: string;
  date: string;
  amount?: number;
  replyDays: number;
}

function filled(value: string, placeholder: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : `[${placeholder}]`;
}

export function buildDemandNotice(input: NoticeInput): string {
  const sender = filled(input.senderName, "your name");
  const paragraphs = [
    `I, ${sender}, give you this notice about the following matter: ${input.matter}.`,
    `The facts are as follows:\n${filled(input.facts, "describe what happened, with dates")}`
  ];
  if (input.amount !== undefined && input.amount > 0) {
    paragraphs.push(`The amount involved is Rs. ${input.amount.toLocaleString("en-IN")}.`);
  }
  paragraphs.push(
    `I therefore require you to ${filled(input.relief, "say what you want them to do")} within ${input.replyDays} days of receiving this notice.`,
    `If you do not comply, I will be compelled to approach the appropriate forum, including under the ${input.act}, at your risk as to costs and consequences.`,
    "This notice is without prejudice to my other rights and remedies."
  );
  return [
    "LEGAL NOTICE",
    "",
    `Date: ${input.date}`,
    "",
    "From:",
    sender,
    filled(input.senderAddress, "your address"),
    "",
    "To:",
    filled(input.recipientName, "name of the other party"),
    filled(input.recipientAddress, "address of the other party"),
    "",
    `Subject: Notice regarding ${input.matter}`,
    "",
    "Sir or Madam,",
    "",
    ...paragraphs.map((p, i) => `${i + 1}. ${p}\n`),
    "Yours faithfully,",
    sender
  ].join("\n");
}
