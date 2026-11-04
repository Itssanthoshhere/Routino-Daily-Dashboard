export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Routino",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Your daily routine, schedule, and focus in one",
  user: {
    name: process.env.NEXT_PUBLIC_USER_NAME || "Santhosh",
    initial: process.env.NEXT_PUBLIC_USER_INITIAL || "S",
  },
  defaults: {
    focusMinutes: parseInt(process.env.NEXT_PUBLIC_DEFAULT_FOCUS_MINUTES || "90", 10),
  },
  links: {
    calendar: process.env.NEXT_PUBLIC_CALENDAR_URL || "https://calendar.google.com",
    mail: process.env.NEXT_PUBLIC_MAIL_URL || "https://mail.google.com",
  },
};
