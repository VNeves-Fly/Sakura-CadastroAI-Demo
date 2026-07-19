export interface WelcomeEmailInput {
  to: string;
  firstName: string;
  temporaryPassword?: string;
}

export interface WelcomeEmailSender {
  send(input: WelcomeEmailInput): Promise<void>;
}
