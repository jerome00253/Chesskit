import { Card, CardContent, Typography, Box, CircularProgress, IconButton } from "@mui/material";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface CoachingSummaryCardProps {
  summary: string | null;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export default function CoachingSummaryCard({
  summary,
  onRegenerate,
  isLoading = false,
}: CoachingSummaryCardProps) {
  if (!summary && !isLoading) return null;

  return (
    <Card
      sx={{
        mb: 3,
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #1e3a5f 0%, #2c5f7f 100%)"
            : "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        border: (theme) =>
          `2px solid ${theme.palette.mode === "dark" ? "#4a90e2" : "#2196f3"}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon icon="mdi:clipboard-text-outline" width={28} color="#2196f3" />
            <Typography variant="h6" fontWeight="bold">
              Coach IA - Synthèse personnalisée
            </Typography>
          </Box>
          {onRegenerate && !isLoading && (
            <IconButton onClick={onRegenerate} size="small" title="Régénérer la synthèse">
              <Icon icon="mdi:refresh" width={20} />
            </IconButton>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ pl: 1 }}>
            <ReactMarkdown
              components={{
                h2: ({ node, ...props }) => (
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1, mb: 1 }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <Typography variant="body2" paragraph {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginLeft: 20 }}>
                    <Typography variant="body2" component="span" {...props} />
                  </li>
                ),
              }}
            >
              {summary || ""}
            </ReactMarkdown>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
