import {
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Box,
  Alert,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { PageTitle } from "@/components/pageTitle";

export { getStaticPaths, getStaticProps };

export default function Login() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(t("invalid_credentials"));
      } else {
        router.push(`/${router.query.locale}`);
      }
    } catch (err) {
      console.error(err);
      setError(t("generic_error"));
    } finally {
      setLoading(false);
    }
  };

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
        <PageTitle title={t("login_title")} />

        <Paper elevation={3} sx={{ p: 4, width: "100%", mt: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label={t("email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label={t("password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
              >
                {t("sign_in")}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2">
                  {t("no_account")}{" "}
                  <Link
                    href={`/${router.query.locale}/register`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      fontWeight: "bold",
                    }}
                  >
                    {t("register_here")}
                  </Link>
                </Typography>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
