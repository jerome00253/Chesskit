import {
  Card,
  CardHeader,
  CardContent,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface PreferencesSettingsProps {
  analysisSettings: any;
  onChange: (newSettings: any) => void;
  hasAiKey: boolean;
}

export const PreferencesSettings = ({
  analysisSettings,
  onChange,
  hasAiKey,
}: PreferencesSettingsProps) => {
  const t = useTranslations("Profile.Preferences");

  const handleChange = (key: string, value: boolean) => {
    onChange({
      ...analysisSettings,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader title={t("title")} />
      <CardContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Comments Switch */}
          <FormControlLabel
            control={
              <Switch
                checked={analysisSettings?.showComments !== false} // Default to true if undefined
                onChange={(e) => handleChange("showComments", e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1">{t("show_comments")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("show_comments_desc")}
                </Typography>
              </Box>
            }
          />

          {/* AI Analysis Switch */}
          <Tooltip
            title={!hasAiKey ? t("no_ai_key") : ""}
            arrow
            placement="top-start"
          >
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      hasAiKey && analysisSettings?.enableAI !== false // Default to true if key exists and not explicitly disabled
                    }
                    onChange={(e) => handleChange("enableAI", e.target.checked)}
                    color="primary"
                    disabled={!hasAiKey}
                  />
                }
                label={
                  <Box>
                    <Typography
                      variant="subtitle1"
                      color={!hasAiKey ? "text.disabled" : "text.primary"}
                    >
                      {t("enable_ai")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("enable_ai_desc")}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};
