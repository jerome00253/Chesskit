import { Container, Typography, Paper, Box, Alert } from "@mui/material";
import { useTranslations } from "next-intl";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { useRouter } from "next/router";
import Link from "next/link";
import { PageTitle } from "@/components/pageTitle";

export { getStaticPaths, getStaticProps };

export default function Register() {
  const t = useTranslations("Auth");
  const router = useRouter();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PageTitle title={t("register_title")} />

        <Paper elevation={3} sx={{ p: 4, width: "100%", mt: 4 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("registration_disabled")}
          </Alert>

          <Box textAlign="center">
            <Typography variant="body2">
              <Link
                href={`/${router.query.locale}/login`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: "bold",
                }}
              >
                {t("sign_in")}
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
