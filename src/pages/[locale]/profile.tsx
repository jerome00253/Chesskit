import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid2 as Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PageTitle } from "@/components/pageTitle";
import { getStaticPaths, getStaticProps } from "@/lib/i18n";
import { AutoImportSettings } from "@/components/profile/AutoImportSettings";
import { SUPPORTED_LOCALES, LOCALE_LABELS, type SupportedLocale } from "@/types/locale";

export { getStaticPaths, getStaticProps };

export default function Profile() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    chesscomUsername: "",
    lichessUsername: "",
    rating: 1200,
    preferredLocale: "en" as SupportedLocale,
  });
  const [verificationStatus, setVerificationStatus] = useState({
    chesscom: { checking: false, valid: null as boolean | null },
    lichess: { checking: false, valid: null as boolean | null },
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // New state for bulk import
  const [importStatus, setImportStatus] = useState({
    chesscom: { importing: false, progress: "" },
    lichess: { importing: false, progress: "" },
  });
  const [importDialog, setImportDialog] = useState({ open: false, platform: "" as "chesscom" | "lichess" | "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            chesscomUsername: data.chesscomUsername || "",
            lichessUsername: data.lichessUsername || "",
            rating: data.rating || 1200,
            preferredLocale: (data.preferredLocale || "en") as SupportedLocale,
          });
          if (data.chesscomUsername) {
            setVerificationStatus((prev) => ({
              ...prev,
              chesscom: { checking: false, valid: true },
            }));
          }
          if (data.lichessUsername) {
            setVerificationStatus((prev) => ({
              ...prev,
              lichess: { checking: false, valid: true },
            }));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchProfile();
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "chesscomUsername") {
      setVerificationStatus((prev) => ({
        ...prev,
        chesscom: { checking: false, valid: null },
      }));
    }
    if (name === "lichessUsername") {
      setVerificationStatus((prev) => ({
        ...prev,
        lichess: { checking: false, valid: null },
      }));
    }
  };

  const verifyAccount = async (platform: "chesscom" | "lichess") => {
    const username =
      platform === "chesscom"
        ? formData.chesscomUsername
        : formData.lichessUsername;
    if (!username) return;

    setVerificationStatus((prev) => ({
      ...prev,
      [platform]: { checking: true, valid: null },
    }));

    try {
      const res = await fetch("/api/user/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, username }),
      });

      const data = await res.json();
      setVerificationStatus((prev) => ({
        ...prev,
        [platform]: { checking: false, valid: data.valid },
      }));
    } catch {
      setVerificationStatus((prev) => ({
        ...prev,
        [platform]: { checking: false, valid: false },
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("save_success") });
        
        // Si la langue a changé, rediriger vers la nouvelle langue
        const currentLocale = (router.query.locale as string) || "en";
        
        if (formData.preferredLocale && formData.preferredLocale !== currentLocale) {
          // Remplacer la locale dans l'URL actuelle
          // On remplace le premier segment correspondant à la locale
          const newPath = router.asPath.replace(`/${currentLocale}`, `/${formData.preferredLocale}`);
          
          setTimeout(() => {
            // Utiliser window.location pour forcer un rechargement complet et appliquer la langue partout
            window.location.href = newPath;
          }, 500);
        }
      } else {
        setMessage({ type: "error", text: t("save_error") });
      }
    } catch {
      setMessage({ type: "error", text: t("save_error") });
    } finally {
      setSaving(false);
    }
  };

  const handleImportGames = async (platform: "chesscom" | "lichess") => {
    const username = platform === "chesscom" ? formData.chesscomUsername : formData.lichessUsername;
    
    if (!username) {
      setMessage({ type: "error", text: t("enter_username_first") });
      return;
    }

    setImportDialog({ open: false, platform: "" });
    setImportStatus((prev) => ({
      ...prev,
      [platform]: { importing: true, progress: t("importing") },
    }));

    try {
      const res = await fetch("/api/games/import-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, username }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: t("import_success", { imported: data.imported, skipped: data.skipped }),
        });
      } else {
        setMessage({ type: "error", text: data.message || t("import_error") });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("import_error") });
    } finally {
      setImportStatus((prev) => ({
        ...prev,
        [platform]: { importing: false, progress: "" },
      }));
    }
  };

  if (!session) return null;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <PageTitle title={t("title")} />

      <Snackbar
        open={!!message.text}
        autoHideDuration={8000}
        onClose={() => setMessage({ type: "", text: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={message.type as "success" | "error"}
          onClose={() => setMessage({ type: "", text: "" })}
        >
          {message.text}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog open={importDialog.open} onClose={() => setImportDialog({ open: false, platform: "" })}>
        <DialogTitle>{t("dialog.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t.rich("dialog.content", { 
              platform: importDialog.platform === "chesscom" ? "Chess.com" : "Lichess" 
            })}
            <br />
            <br />
            {t("dialog.duplicates_ignored")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog({ open: false, platform: "" })}>{t("dialog.cancel")}</Button>
          <Button 
            onClick={() => handleImportGames(importDialog.platform as "chesscom" | "lichess")} 
            variant="contained"
            autoFocus
          >
            {t("dialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardHeader title={t("personal_info")} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label={t("nickname")}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    helperText={t("nickname_helper")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("first_name")}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t("last_name")}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t("language_preference")}</InputLabel>
                    <Select
                      value={formData.preferredLocale}
                      label={t("language_preference")}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          preferredLocale: e.target.value as SupportedLocale,
                        }))
                      }
                    >
                      {SUPPORTED_LOCALES.map((locale) => (
                        <MenuItem key={locale} value={locale}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <span style={{ fontSize: "1.2rem" }}>
                              {LOCALE_LABELS[locale].flag}
                            </span>
                            <span>{LOCALE_LABELS[locale].name}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label={t("email")}
                    value={session.user?.email || ""}
                    disabled
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Elo Rating"
                    value={formData.rating}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="mdi:star" color="gold" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card>
            <CardHeader title={t("external_accounts")} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label={t("chess_com_username")}
                    name="chesscomUsername"
                    value={formData.chesscomUsername}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon
                            icon="simple-icons:chessdotcom"
                            color="#6D9E40"
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {verificationStatus.chesscom.checking ? (
                            <CircularProgress size={20} />
                          ) : (
                            <IconButton
                              onClick={() => verifyAccount("chesscom")}
                              disabled={!formData.chesscomUsername}
                              color={
                                verificationStatus.chesscom.valid
                                  ? "success"
                                  : verificationStatus.chesscom.valid === false
                                    ? "error"
                                    : "default"
                              }
                            >
                              {verificationStatus.chesscom.valid ? (
                                <Icon icon="mdi:check-circle" />
                              ) : (
                                <Icon icon="mdi:magnify" />
                              )}
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }}
                    helperText={
                      verificationStatus.chesscom.valid === true
                        ? t("verified")
                        : verificationStatus.chesscom.valid === false
                          ? t("not_found")
                          : ""
                    }
                    error={verificationStatus.chesscom.valid === false}
                  />
                </Grid>

                {/* Chess.com Import Button */}
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    disabled={!formData.chesscomUsername || importStatus.chesscom.importing}
                    onClick={() => setImportDialog({ open: true, platform: "chesscom" })}
                    startIcon={
                      importStatus.chesscom.importing ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Icon icon="mdi:download" />
                      )
                    }
                  >
                    {importStatus.chesscom.importing
                      ? importStatus.chesscom.progress
                      : t("import_all_chess_com")}
                  </Button>
                  {importStatus.chesscom.importing && <LinearProgress sx={{ mt: 1 }} />}
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    label={t("lichess_username")}
                    name="lichessUsername"
                    value={formData.lichessUsername}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="simple-icons:lichess" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {verificationStatus.lichess.checking ? (
                            <CircularProgress size={20} />
                          ) : (
                            <IconButton
                              onClick={() => verifyAccount("lichess")}
                              disabled={!formData.lichessUsername}
                              color={
                                verificationStatus.lichess.valid
                                  ? "success"
                                  : verificationStatus.lichess.valid === false
                                    ? "error"
                                    : "default"
                              }
                            >
                              {verificationStatus.lichess.valid ? (
                                <Icon icon="mdi:check-circle" />
                              ) : (
                                <Icon icon="mdi:magnify" />
                              )}
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }}
                    helperText={
                      verificationStatus.lichess.valid === true
                        ? t("verified")
                        : verificationStatus.lichess.valid === false
                          ? t("not_found")
                          : ""
                    }
                    error={verificationStatus.lichess.valid === false}
                  />
                </Grid>

                {/* Lichess Import Button */}
                <Grid size={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    disabled={!formData.lichessUsername || importStatus.lichess.importing}
                    onClick={() => setImportDialog({ open: true, platform: "lichess" })}
                    startIcon={
                      importStatus.lichess.importing ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Icon icon="mdi:download" />
                      )
                    }
                  >
                    {importStatus.lichess.importing
                      ? importStatus.lichess.progress
                      : t("import_all_lichess")}
                  </Button>
                  {importStatus.lichess.importing && <LinearProgress sx={{ mt: 1 }} />}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>



        {/* Auto-Import Settings */}
        <Grid size={12}>
          <AutoImportSettings />
        </Grid>

        <Grid size={12}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving || loading}
            startIcon={
              saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Icon icon="mdi:content-save" />
              )
            }
          >
            {t("save")}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
