export interface MailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export class MailerService {
  async send(_message: MailMessage): Promise<void> {
    // TODO: integrate transactional email provider
  }
}
