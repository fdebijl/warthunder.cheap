export interface MailFactory {
  /** Generate an email from the given alert and item(s), chain with #send to send the generated email */
  generate(): Promise<MailFactory>;

  /** Dispatch the generated email, chain with #cleanup to remove the triggering alert afterwards */
  send(): Promise<MailFactory>;

  /** Remove the alert responsible for triggering this email */
  cleanup(): Promise<MailFactory>;
}
