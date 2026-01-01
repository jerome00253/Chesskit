import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { TacticalDescription } from "@/components/TacticalDescription";
import { useTranslations } from "next-intl";

interface TacticalCommentBubbleProps {
  moveType: string;
  playedMoveDescription?: string;
  bestMoveDescription?: string;
  themes?: string[];
  bestMoveThemes?: string[];
  move?: string;
  bestMove?: string;
  onAnalyze?: () => void;
}

// Map move types to icon filenames in Coach/ directory
const getMoveTypeIcon = (moveType: string): string => {
  const typeMap: Record<string, string> = {
    excellent: "Excellent.png",
    best: "meilleur.png",
    good: "bon.png",
    okay: "bon.png",
    inaccuracy: "imprecis.png",
    mistake: "gaffe.png",
    blunder: "erreur.png",
    brilliant: "sublime.png",
    splendid: "sublime.png",
    perfect: "meilleur.png",
    forced: "seul.png",
    opening: "ouverture.png",
  };

  const normalizedType = moveType?.toLowerCase() || "";
  return `/icons/Coach/${typeMap[normalizedType] || "normal.png"}`;
};

// Map move types to background colors with better contrast
const getMoveTypeColor = (moveType: string): string => {
  const colorMap: Record<string, string> = {
    excellent: "#C5E1F7", // Deeper blue
    best: "#C8E6C9", // Deeper green
    good: "#E8E8E8", // Medium gray
    okay: "#E8E8E8",
    inaccuracy: "#FFF59D", // Deeper yellow (more visible)
    mistake: "#FFCC80", // Deeper orange
    blunder: "#FFAB91", // Deeper soft red
    brilliant: "#E1BEE7", // Deeper purple
    splendid: "#E1BEE7",
    perfect: "#B2DFDB", // Deeper teal
    forced: "#E8E8E8",
    opening: "#E8E8E8",
  };

  const normalizedType = moveType?.toLowerCase() || "";
  return colorMap[normalizedType] || "#E8E8E8";
};

// Map move types to border colors with good contrast
const getMoveTypeBorderColor = (moveType: string): string => {
  const borderMap: Record<string, string> = {
    excellent: "#64B5F6",
    best: "#81C784",
    good: "#BDBDBD",
    okay: "#BDBDBD",
    inaccuracy: "#FFD54F",
    mistake: "#FF9800",
    blunder: "#F4511E",
    brilliant: "#BA68C8",
    splendid: "#BA68C8",
    perfect: "#4DB6AC",
    forced: "#BDBDBD",
    opening: "#BDBDBD",
  };

  const normalizedType = moveType?.toLowerCase() || "";
  return borderMap[normalizedType] || "#BDBDBD";
};

// Map move types to text colors (darker for light backgrounds)
const getMoveTypeTextColor = (moveType: string): string => {
  const textColorMap: Record<string, string> = {
    excellent: "#1565C0", // Dark blue
    best: "#2E7D32", // Dark green
    good: "#424242", // Dark gray
    okay: "#424242",
    inaccuracy: "#F57F17", // Dark yellow/gold
    mistake: "#E65100", // Dark orange
    blunder: "#C62828", // Dark red
    brilliant: "#6A1B9A", // Dark purple
    splendid: "#6A1B9A",
    perfect: "#00695C", // Dark teal
    forced: "#424242",
    opening: "#424242",
  };

  const normalizedType = moveType?.toLowerCase() || "";
  return textColorMap[normalizedType] || "#424242";
};

export default function TacticalCommentBubble({
  moveType,
  playedMoveDescription,
  bestMoveDescription,
  themes = [],
  bestMoveThemes = [],
  move,
  bestMove,
  onAnalyze,
}: TacticalCommentBubbleProps) {
  const iconSrc = getMoveTypeIcon(moveType);
  const bgColor = getMoveTypeColor(moveType);
  const borderColor = getMoveTypeBorderColor(moveType);
  const textColor = getMoveTypeTextColor(moveType);
  const t = useTranslations("Tactical");

  // If no descriptions, just show the icon aligned to the left
  if (!playedMoveDescription && !bestMoveDescription) {
    return (
      <Box
        sx={{
          width: "100%", // Full width to allow alignment
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start", // Align to left
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <img
            src="/icons/Coach/normal.png"
            alt="coach"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        width: "100%",
        maxWidth: "100%",
        height: 120,
        alignItems: "stretch",
      }}
    >
      {/* Move Type Icon - Fixed size */}
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: 2,
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <img
          src={iconSrc}
          alt={moveType}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Speech Bubble - Fixed height with scroll */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          maxHeight: 120,
          p: 1,
          backgroundColor: bgColor,
          borderRadius: 2,
          border: `2px solid ${borderColor}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          position: "relative",
          overflow: "auto",
          // Speech bubble tail pointing LEFT toward icon
          "&::before": {
            content: '""',
            position: "absolute",
            left: -8,
            top: 20,
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: `8px solid ${borderColor}`,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            left: -6,
            top: 21,
            width: 0,
            height: 0,
            borderTop: "7px solid transparent",
            borderBottom: "7px solid transparent",
            borderRight: `7px solid ${bgColor}`,
          },
        }}
      >
        {/* Content Area - Scrollable */}
        <Box sx={{ width: "100%" }}>
          {/* Line 1: Played Move Commentary */}
          {playedMoveDescription && (
            <Box sx={{ mb: bestMoveDescription ? 0.5 : 0 }}>
              <Box
                sx={{
                  fontSize: "0.75rem",
                  lineHeight: 1.3,
                  color: textColor,
                }}
              >
                {/* Theme Badges BEFORE description */}
                {/* Theme Badges BEFORE description */}
                {Array.isArray(themes) && themes.length > 0 && (
                  <Box
                    component="span"
                    sx={{ display: "inline-flex", gap: 0.3, mr: 0.3, flexWrap: "wrap" }}
                  >
                    {themes.map((theme, index) => (
                      <Chip
                        key={index}
                        label={t("themes." + theme.toLowerCase().replace(/\s+/g, ''))}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          fontWeight: 500,
                          backgroundColor: "rgba(0,0,0,0.08)",
                          color: "#424242",
                          "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.12)",
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
                <TacticalDescription description={playedMoveDescription} />
              </Box>
            </Box>
          )}
              
          {/* Analyze Icon if manual analysis is available (meaning it's a default/fallback comment) */}
          {onAnalyze && (
            <Box sx={{ mt: 0.5 }}>
              <Chip
                icon={<SearchIcon style={{ fontSize: '0.9rem', color: textColor }} />}
                label={t("actions.analyze_move")}
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyze();
                }}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  backgroundColor: "rgba(0,0,0,0.06)", // Revert to slight gray
                  color: textColor, // Use same text color as description
                  border: `1px solid ${textColor}40`, // Subtle border extended from text color
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.12)",
                    borderColor: textColor,
                  }
                }}
              />
            </Box>
          )}
          
          {/* Line 2: Best Move Commentary */}
          {bestMoveDescription && bestMove && move !== bestMove && (
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.7rem",
                lineHeight: 1.3,
                color: textColor,
                fontStyle: "italic",
              }}
            >
              {/* Theme Badges for Best Move */}
              {/* Theme Badges for Best Move */}
              {Array.isArray(bestMoveThemes) && bestMoveThemes.length > 0 && (
                <Box
                  component="span"
                  sx={{ display: "inline-flex", gap: 0.3, mr: 0.6, flexWrap: "wrap", verticalAlign: "middle" }}
                >
                  {bestMoveThemes.map((theme, index) => (
                    <Chip
                      key={index}
                      label={t("themes." + theme.toLowerCase().replace(/\s+/g, ''))}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: "0.6rem",
                        fontWeight: 500,
                        backgroundColor: "rgba(0,0,0,0.08)",
                        color: "#424242",
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                    />
                  ))}
                </Box>
              )}
              {t("descriptions.by_playing", { move: bestMove })} <TacticalDescription description={bestMoveDescription} />
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
