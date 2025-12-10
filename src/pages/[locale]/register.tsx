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
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { PageTitle } from "@/components/pageTitle";

export { getStaticPaths, getStaticProps };

export default function Register() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong!");
      }

      router.push(`/${router.query.locale}/login`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t("generic_error"));
      }
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
        <PageTitle title={t("register_title")} />

        <Paper elevation={3} sx={{ p: 4, width: "100%", mt: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label={t("name")}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />

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
                helperText={t("password_requirements")}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
              >
                {t("sign_up")}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2">
                  {t("already_account")}{" "}
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
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
