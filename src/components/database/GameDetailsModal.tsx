import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Avatar,
  Chip,
  Link,
  Divider,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Game } from "@/types/game";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";

interface GameDetailsModalProps {
  open: boolean;
  onClose: () => void;
  game: Game | null;
}

export function GameDetailsModal({
  open,
  onClose,
  game,
}: GameDetailsModalProps) {
  const t = useTranslations("Database");
  const theme = useTheme(); // Hook theme
  const router = useRouter(); // Hook router
  const locale = useLocale(); // Hook locale
  const { data: session } = useSession();
  const analysisSettings = (session?.user as any)?.analysisSettings;
  const enableAI = analysisSettings?.enableAI !== false;
  const [aiAnalysis, setAiAnalysis] = useState<string | undefined>(game?.aiAnalysis);

  const markdownComponents = useMemo(() => ({
    h1: ({ node, children, ...props }: any) => {
        let icon = "mdi:chess-pawn";
        const text = String(children);
        if (text.includes(t("Details.ai_headers.summary")) || text.includes("Résumé")) icon = "mdi:text-box-outline";
        else if (text.includes(t("Details.ai_headers.key_moments")) || text.includes("Analyse")) icon = "mdi:magnify-plus-outline";
        else if (text.includes(t("Details.ai_headers.advice")) || text.includes("Conseils")) icon = "mdi:lightbulb-on-outline";
        
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, mb: 1 }}>
                <Icon icon={icon} width={24} style={{ opacity: 0.7 }} />
                <Typography variant="h6" fontWeight="bold" {...props}>
                    {children}
                </Typography>
            </Box>
        );
    },
    h2: ({ node, children, ...props }: any) => {
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, mb: 1 }}>
                <Icon icon="mdi:chevron-right" width={20} style={{ opacity: 0.5 }} />
                <Typography variant="subtitle1" fontWeight="bold" {...props}>{children}</Typography>
            </Box>
        );
    },
    h3: ({ node, ...props }: any) => <Typography variant="subtitle2" gutterBottom sx={{ mt: 1, fontWeight: 'bold' }} {...props} />,
    p: ({ node, ...props }: any) => <Typography variant="body2" paragraph {...props} />,
    li: ({ node, ...props }: any) => (
      <li style={{ marginLeft: 20 }}>
        <Typography variant="body2" component="span" {...props} />
      </li>
    ),
    a: ({ node, href, children, ...props }: any) => {
        if (href?.startsWith("#move-")) {
            const moveSan = href.replace("#move-", "");
            return (
                <span
                    style={{
                        color: theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.primary.main,
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        router.push(`/${locale}/analysis?gameId=${game?.id}&move=${moveSan}`);
                    }}
                    title={t("Details.see_move_tooltip", { move: moveSan })}
                >
                    {children}
                </span>
            );
        }
        return <a href={href} style={{ color: theme.palette.text.primary }} {...props}>{children}</a>;
    }
  }), [theme, router, locale, game?.id, onClose]);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  
  // Sync state when game prop updates
  // Sync state when game prop updates
  useEffect(() => {
    if (game?.aiSummary || game?.aiKeyMoments || game?.aiAdvice) {
        // Reconstruct from parts
        let reconstructed = "";

        if (game.aiSummary) reconstructed += `# ${t("Details.ai_headers.summary")}\n\n${game.aiSummary}\n\n`;
        if (game.aiKeyMoments) reconstructed += `# ${t("Details.ai_headers.key_moments")}\n\n${game.aiKeyMoments}\n\n`;
        if (game.aiAdvice) reconstructed += `# ${t("Details.ai_headers.advice")}\n\n${game.aiAdvice}`;
        setAiAnalysis(reconstructed);
    } else {
        setAiAnalysis(game?.aiAnalysis);
    }
  }, [game]);
  
  const handleAnalyzeAI = async () => {
    if (!game) return;
    setIsAnalyzingAI(true);
    try {
      const response = await fetch(`/api/games/${game.id}/ai-analysis`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.uniqueSegments) {
        // Update local state with reconstructed text
        let reconstructed = "";
        if (data.uniqueSegments.summary) reconstructed += `# ${t("Details.ai_headers.summary")}\n\n${data.uniqueSegments.summary}\n\n`;
        if (data.uniqueSegments.keyMoments) reconstructed += `# ${t("Details.ai_headers.key_moments")}\n\n${data.uniqueSegments.keyMoments}\n\n`;
        if (data.uniqueSegments.advice) reconstructed += `# ${t("Details.ai_headers.advice")}\n\n${data.uniqueSegments.advice}`;
        
        setAiAnalysis(reconstructed);
        
        // Update game object reference
        if (game) {
             game.aiSummary = data.uniqueSegments.summary;
             game.aiKeyMoments = data.uniqueSegments.keyMoments;
             game.aiAdvice = data.uniqueSegments.advice;
             game.aiAnalysis = data.analysis; // Backup
        }
      } else if (data.analysis) {
        setAiAnalysis(data.analysis);
        // Update reference for consistency
        game.aiAnalysis = data.analysis;
      }
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  if (!game) return null;

  // Determine winner
  const getWinnerInfo = () => {
    if (game.result === "1-0")
      return { winner: game.white.name, color: "white" };
    if (game.result === "0-1")
      return { winner: game.black.name, color: "black" };
    return { winner: "Nulle", color: "draw" };
  };

  const winnerInfo = getWinnerInfo();

  // Result color
  const getResultColor = () => {
    if (game.result === "1-0") return "success.main";
    if (game.result === "0-1") return "error.main";
    return "warning.main";
  };

  // Format termination with translation
  const formatTermination = (termination: string | undefined) => {
    if (!termination) return "—";

    const lowerTerm = termination.toLowerCase();
    const winner = getWinnerInfo().winner;

    if (lowerTerm.includes("checkmate") || lowerTerm.includes("mate")) {
      return t("termination.won_by_checkmate", { winner });
    } else if (
      lowerTerm.includes("resignation") ||
      lowerTerm.includes("abandon")
    ) {
      return t("termination.won_by_resignation", { winner });
    } else if (lowerTerm.includes("time") || lowerTerm.includes("timeout")) {
      return t("Details.won_by_time", { winner });
    } else if (lowerTerm.includes("stalemate")) {
      return t("termination.draw_by_stalemate");
    } else if (lowerTerm.includes("insufficient")) {
      return t("termination.draw_by_insufficient_material");
    } else if (lowerTerm.includes("repetition")) {
      return t("termination.draw_by_threefold_repetition");
    } else if (lowerTerm.includes("fifty")) {
      return t("termination.draw_by_fifty_move_rule");
    }

    return termination;
  };




  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {t("Details.title")}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="mdi:chess-board" />}
            onClick={() => {
              onClose();
              router.push(`/${locale}/analysis?gameId=${game.id}`);
            }}
          >
            {t("Details.open_analysis")}
          </Button>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Icon icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Players Section */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* White Player */}
            <Grid item xs={5}>
              <Card
                elevation={game.userColor === "white" ? 8 : 2}
                sx={{
                  bgcolor:
                    game.userColor === "white"
                      ? "primary.light"
                      : "background.paper",
                  border: game.result === "1-0" ? 3 : 0,
                  borderColor: "success.main",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "grey.300", width: 56, height: 56 }}>
                      <Icon icon="mdi:chess-king" width={32} color="#000" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {game.white.name}
                        {game.userColor === "white" && (
                          <Chip
                            label={t("Details.me")}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      {game.white.rating && (
                        <Typography variant="body2" color="text.secondary">
                          Elo: {game.white.rating}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* VS & Result */}
            <Grid item xs={2} sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={getResultColor()}
              >
                {game.result || "?"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                VS
              </Typography>
            </Grid>

            {/* Black Player */}
            <Grid item xs={5}>
              <Card
                elevation={game.userColor === "black" ? 8 : 2}
                sx={{
                  bgcolor:
                    game.userColor === "black"
                      ? "primary.light"
                      : "background.paper",
                  border: game.result === "0-1" ? 3 : 0,
                  borderColor: "success.main",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "grey.800", width: 56, height: 56 }}>
                      <Icon icon="mdi:chess-king" width={32} color="#fff" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {game.black.name}
                        {game.userColor === "black" && (
                          <Chip
                            label={t("Details.me")}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      {game.black.rating && (
                        <Typography variant="body2" color="text.secondary">
                          Elo: {game.black.rating}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Game Information */}
        <Grid container spacing={2}>
          {/* Event & Site */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:trophy" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                {t("Details.event")}
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="500">
              {game.event || "—"}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:web" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                {t("Details.platform")}
              </Typography>
            </Box>
            {game.site && game.site.startsWith("http") ? (
              <Link
                href={game.site}
                target="_blank"
                rel="noopener"
                underline="hover"
              >
                <Typography variant="body1" fontWeight="500">
                  {game.site}
                </Typography>
              </Link>
            ) : (
              <Typography variant="body1" fontWeight="500">
                {game.site || "—"}
              </Typography>
            )}
          </Grid>

          {/* Date */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:calendar" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                {t("Details.date")}
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="500">
              {game.date
                ? new Date(game.date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </Typography>
          </Grid>

          {/* Time Control */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:clock-outline" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                {t("Details.time_control")}
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="500">
              {game.timeControl || "—"}
            </Typography>
          </Grid>

          {/* Opening */}
          {game.openingName && (
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Icon icon="mdi:book-open-variant" width={20} color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t("Details.opening")}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" fontWeight="500">
                  {game.openingName}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {game.openingECO && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      {game.openingECO}
                    </Typography>
                  )}
                  {game.openingECO && game.openingName && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                      sx={{ mx: 0.5 }}
                    >
                      •
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="span"
                    sx={{ fontStyle: "italic" }}
                  >
                    {game.openingName}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Termination */}
          {game.termination && (
            <Grid item xs={12}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Icon icon="mdi:flag-checkered" width={20} color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t("Details.termination")}
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="500">
                {formatTermination(game.termination)}
              </Typography>
            </Grid>
          )}

          {/* Winner */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon icon="mdi:medal" width={20} color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                {t("Details.result")}
              </Typography>
            </Box>
            <Chip
              label={winnerInfo.winner}
              color={
                winnerInfo.color === "white"
                  ? "default"
                  : winnerInfo.color === "black"
                    ? "primary"
                    : "warning"
              }
              sx={{ fontWeight: "bold" }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* AI Analysis Section - Hidden if AI disabled */}
        {enableAI && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Icon icon="mdi:robot" width={24} />
            {t("Details.ai_analysis")}
          </Typography>
          
          {aiAnalysis ? (
            <Card variant="outlined" sx={{ bgcolor: "background.default" }}>
              <CardContent>
                  <ReactMarkdown components={markdownComponents}>
                    {aiAnalysis?.replace(/\[\[(.*?)\]\]/g, "[$1](#move-$1)") || ""}
                  </ReactMarkdown>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 2 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {t("Details.ai_description")}
              </Typography>
              <Button
                variant="contained"
                startIcon={isAnalyzingAI ? <Icon icon="mdi:loading" className="spin" /> : <Icon icon="mdi:magic-staff" />}
                onClick={handleAnalyzeAI}
                disabled={!game.analyzed || isAnalyzingAI}
              >
                {isAnalyzingAI ? t("Details.ai_processing") : t("Details.analyze_with_ai")}
              </Button>
              {!game.analyzed && (
                <Typography variant="caption" color="error">
                  {t("Details.ai_warning")}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Analysis Statistics Section */}
        {game.analyzed && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Icon icon="mdi:brain" width={24} />
                {t("Details.analysis_stats")}
              </Typography>

              {/* Engine Info */}
              <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                {game.engineName && (
                  <Chip
                    icon={<Icon icon="mdi:engine" width={16} />}
                    label={game.engineName}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {game.engineDepth && (
                  <Chip
                    icon={<Icon icon="mdi:layers" width={16} />}
                    label={t("Details.depth", { depth: game.engineDepth })}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                {/* White Player Stats */}
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{ bgcolor: "background.default" }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Icon icon="mdi:chess-king" width={20} />
                        {game.white.name}
                      </Typography>

                      {/* Accuracy */}
                      {game.whiteAccuracy != null && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("Details.accuracy")}
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color="primary.main"
                          >
                            {game.whiteAccuracy.toFixed(1)}%
                          </Typography>
                        </Box>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {t("Details.move_quality")}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {(game.whiteBrilliant ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              💎 {t("Details.classification.brilliant")}
                            </Typography>
                            <Chip
                              label={game.whiteBrilliant}
                              size="small"
                              color="success"
                            />
                          </Box>
                        )}
                        {(game.whiteSplendid ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✨ {t("Details.classification.splendid")}
                            </Typography>
                            <Chip
                              label={game.whiteSplendid}
                              size="small"
                              sx={{ bgcolor: "#00bcd4" }}
                            />
                          </Box>
                        )}
                        {(game.whitePerfect ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              🔵 {t("Details.classification.perfect")}
                            </Typography>
                            <Chip
                              label={game.whitePerfect}
                              size="small"
                              sx={{ bgcolor: "#2196f3" }}
                            />
                          </Box>
                        )}
                        {(game.whiteBest ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⭐ {t("Details.classification.best")}
                            </Typography>
                            <Chip
                              label={game.whiteBest}
                              size="small"
                              sx={{ bgcolor: "#4caf50" }}
                            />
                          </Box>
                        )}
                        {(game.whiteExcellent ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✅ {t("Details.classification.excellent")}
                            </Typography>
                            <Chip
                              label={game.whiteExcellent}
                              size="small"
                              sx={{ bgcolor: "#8bc34a" }}
                            />
                          </Box>
                        )}
                        {(game.whiteOkay ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              👍 {t("Details.classification.okay")}
                            </Typography>
                            <Chip
                              label={game.whiteOkay}
                              size="small"
                              sx={{ bgcolor: "#cddc39" }}
                            />
                          </Box>
                        )}
                        {(game.whiteOpening ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              📖 {t("Details.classification.opening")}
                            </Typography>
                            <Chip
                              label={game.whiteOpening}
                              size="small"
                              sx={{ bgcolor: "#dbac86" }}
                            />
                          </Box>
                        )}
                        {(game.whiteInaccuracy ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⚠️ {t("Details.classification.inaccuracy")}
                            </Typography>
                            <Chip
                              label={game.whiteInaccuracy}
                              size="small"
                              sx={{ bgcolor: "#f2be1f" }}
                            />
                          </Box>
                        )}
                        {(game.whiteMistakes ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">❌ {t("Details.classification.mistake")}</Typography>
                            <Chip
                              label={game.whiteMistakes}
                              size="small"
                              sx={{ bgcolor: "#ff9800" }}
                            />
                          </Box>
                        )}
                        {(game.whiteBlunders ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">💥 {t("Details.classification.blunder")}</Typography>
                            <Chip
                              label={game.whiteBlunders}
                              size="small"
                              color="error"
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Black Player Stats */}
                <Grid item xs={12} md={6}>
                  <Card
                    variant="outlined"
                    sx={{ bgcolor: "background.default" }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Icon icon="mdi:chess-king" width={20} />
                        {game.black.name}
                      </Typography>

                      {/* Accuracy */}
                      {game.blackAccuracy != null && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {t("Details.accuracy")}
                          </Typography>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color="primary.main"
                          >
                            {game.blackAccuracy.toFixed(1)}%
                          </Typography>
                        </Box>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {t("Details.move_quality")}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {(game.blackBrilliant ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              💎 {t("Details.classification.brilliant")}
                            </Typography>
                            <Chip
                              label={game.blackBrilliant}
                              size="small"
                              color="success"
                            />
                          </Box>
                        )}
                        {(game.blackSplendid ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✨ {t("Details.classification.splendid")}
                            </Typography>
                            <Chip
                              label={game.blackSplendid}
                              size="small"
                              sx={{ bgcolor: "#00bcd4" }}
                            />
                          </Box>
                        )}
                        {(game.blackPerfect ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              🔵 {t("Details.classification.perfect")}
                            </Typography>
                            <Chip
                              label={game.blackPerfect}
                              size="small"
                              sx={{ bgcolor: "#2196f3" }}
                            />
                          </Box>
                        )}
                        {(game.blackBest ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⭐ {t("Details.classification.best")}
                            </Typography>
                            <Chip
                              label={game.blackBest}
                              size="small"
                              sx={{ bgcolor: "#4caf50" }}
                            />
                          </Box>
                        )}
                        {(game.blackExcellent ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ✅ {t("Details.classification.excellent")}
                            </Typography>
                            <Chip
                              label={game.blackExcellent}
                              size="small"
                              sx={{ bgcolor: "#8bc34a" }}
                            />
                          </Box>
                        )}
                        {(game.blackOkay ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              👍 {t("Details.classification.okay")}
                            </Typography>
                            <Chip
                              label={game.blackOkay}
                              size="small"
                              sx={{ bgcolor: "#cddc39" }}
                            />
                          </Box>
                        )}
                        {(game.blackOpening ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              📖 {t("Details.classification.opening")}
                            </Typography>
                            <Chip
                              label={game.blackOpening}
                              size="small"
                              sx={{ bgcolor: "#dbac86" }}
                            />
                          </Box>
                        )}
                        {(game.blackInaccuracy ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">
                              ⚠️ {t("Details.classification.inaccuracy")}
                            </Typography>
                            <Chip
                              label={game.blackInaccuracy}
                              size="small"
                              sx={{ bgcolor: "#f2be1f" }}
                            />
                          </Box>
                        )}
                        {(game.blackMistakes ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">❌ {t("Details.classification.mistake")}</Typography>
                            <Chip
                              label={game.blackMistakes}
                              size="small"
                              sx={{ bgcolor: "#ff9800" }}
                            />
                          </Box>
                        )}
                        {(game.blackBlunders ?? 0) > 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="caption">💥 {t("Details.classification.blunder")}</Typography>
                            <Chip
                              label={game.blackBlunders}
                              size="small"
                              color="error"
                            />
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Links */}
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {t("Details.links")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {game.gameUrl && (
              <Link
                href={game.gameUrl}
                target="_blank"
                rel="noopener"
                underline="hover"
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icon icon="mdi:open-in-new" width={18} />
                  <Typography variant="body2">
                    {t("Details.view_online")}
                  </Typography>
                </Box>
              </Link>
            )}
            {game.ecoUrl && (
              <Link
                href={game.ecoUrl}
                target="_blank"
                rel="noopener"
                underline="hover"
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Icon icon="mdi:information-outline" width={18} />
                  <Typography variant="body2">{t("Details.opening_info")}</Typography>
                </Box>
              </Link>
            )}
            {!game.gameUrl && !game.ecoUrl && (
              <Typography variant="body2" color="text.secondary">
                {t("Details.no_links")}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
