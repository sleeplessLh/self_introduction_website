export const hostEmail = 'lawrancehii12345@gmail.com';
export const gmailComposeUrl = email => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email || hostEmail)}`;
export const mailtoUrl = email => `mailto:${email || hostEmail}`;
export function openEmail(event, email = hostEmail) {
  event.preventDefault();
  const popup = window.open(gmailComposeUrl(email), '_blank', 'noopener,noreferrer');
  if (!popup) window.location.href = mailtoUrl(email);
}
