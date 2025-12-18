import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "@/lib/i18n";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export default withAuth(
  function middleware(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow access to login, register, and root (for language redirect)
        if (path.match(/(\/login)|(\/register)/) || path === "/" || !!token) {
          return true;
        }

        return false;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon-.*\\.png|android-chrome-.*\\.png|apple-touch-icon\\.png|site\\.webmanifest|social-networks-.*\\.png|engines|assets|piece|sounds|icons).*)",
  ],
};
