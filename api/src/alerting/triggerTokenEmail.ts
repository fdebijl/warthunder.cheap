import { Alert, MailTokenFactory } from 'wtcheap.shared';

export const triggerTokenEmail = async (email: string, token: string): Promise<void> => {
  const alert: Alert = {
    recipient: email,
    payload: {
      token
    }
  };

  const factory = new MailTokenFactory(alert);

  await factory.generate()
    .then(f => f.send())
    .then(f => f.cleanup());

  return;
}
