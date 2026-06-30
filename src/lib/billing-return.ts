export function isPaymentSuccessStatus(status: string | null | undefined) {
  if (!status) return false;
  const s = status.toLowerCase();
  return (
    s === 'succeeded' ||
    s === 'success' ||
    s === 'active' ||
    s === 'paid' ||
    s === 'completed'
  );
}

export function isPaymentFailureStatus(status: string | null | undefined) {
  if (!status) return false;
  const s = status.toLowerCase();
  return (
    s === 'failed' ||
    s === 'failure' ||
    s === 'cancelled' ||
    s === 'canceled' ||
    s === 'declined' ||
    s === 'expired'
  );
}
