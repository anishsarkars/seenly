export function isProfileEmbeddable(user: { embedEnabled?: boolean | null }) {
  return user.embedEnabled === true;
}
