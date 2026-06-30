import DodoPayments from 'dodopayments';

let client: DodoPayments | null = null;

export function getDodoClient() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) {
    throw new Error('DODO_PAYMENTS_API_KEY is not configured.');
  }

  if (!client) {
    client = new DodoPayments({
      bearerToken,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
      environment: process.env.DODO_PAYMENTS_ENV === 'test_mode' ? 'test_mode' : 'live_mode',
    });
  }

  return client;
}

export function getDodoProductIds() {
  const pro = process.env.DODO_PRO_PRODUCT_ID;
  const founder = process.env.DODO_FOUNDER_PRODUCT_ID;

  if (!pro || !founder) {
    throw new Error('Dodo product IDs are not configured.');
  }

  return { pro, founder };
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
