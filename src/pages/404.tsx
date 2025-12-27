import { Container, Typography, Box, Button } from "@mui/material";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import { defaultLocale } from "@/lib/i18n";

export default function Custom404() {
  const t = useTranslations("Index"); // Using Index or a dedicated Error namespace if available
  const router = useRouter();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Button
          variant="contained"
          component={Link}
          href={`/${router.query.locale || defaultLocale}`}
          sx={{ mt: 4 }}
        >
          Go Home
        </Button>
      </Box>
    </Container>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  // 404 does not receive 'locale' in params usually, but next-intl might handle it if inside [locale]?
  // Actually 404.tsx is global.
  // We should load default locale or try to detect?
  // For static generation, 404 is usually generated once.
  // We'll load default locale messages to be safe.
  
  const messages = (await import(`../messages/${defaultLocale}.json`)).default;
  
  return {
    props: {
      messages,
      locale: defaultLocale
    },
  };
}
