import { Game } from "@/types/game";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

interface EditGameDialogProps {
  open: boolean;
  game: Game | null;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (id: number, data: any) => Promise<void>;
}

export const EditGameDialog = ({
  open,
  game,
  onClose,
  onSave,
}: EditGameDialogProps) => {
  const t = useTranslations("Database");
  const tCommon = useTranslations("Common");
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    event: "",
    site: "",
    date: "",
    round: "",
    whiteName: "",
    whiteRating: "",
    blackName: "",
    blackRating: "",
    result: "",
  });

  const [whiteIsMe, setWhiteIsMe] = useState(false);
  const [blackIsMe, setBlackIsMe] = useState(false);

  useEffect(() => {
    if (game) {
      setFormData({
        event: game.event || "",
        site: game.site || "",
        date: game.date || "",
        round: game.round || "",
        whiteName: game.white.name || "",
        whiteRating: game.white.rating?.toString() || "",
        blackName: game.black.name || "",
        blackRating: game.black.rating?.toString() || "",
        result: game.result || "*",
      });

      // Check if "Me" logic applies initially?
      // Maybe not necessary to auto-check on open unless we know for sure.
      // But we can leave them unchecked by default or check if name matches session user name.
      if (session?.user?.name) {
        if (game.white.name === session.user.name) setWhiteIsMe(true);
        else setWhiteIsMe(false);

        if (game.black.name === session.user.name) setBlackIsMe(true);
        else setBlackIsMe(false);
      }
    }
  }, [game, session]);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleMeChange =
    (color: "white" | "black") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      const userName = session?.user?.name || "";

      if (color === "white") {
        setWhiteIsMe(isChecked);
        // If checking, set name to me. If unchecking, leave as is (editable).
        if (isChecked) {
          setFormData((prev) => ({ ...prev, whiteName: userName }));
          if (blackIsMe) setBlackIsMe(false); // Can't be both? User said "block me in black and white" - maybe exclusive?
        }
      } else {
        setBlackIsMe(isChecked);
        if (isChecked) {
          setFormData((prev) => ({ ...prev, blackName: userName }));
          if (whiteIsMe) setWhiteIsMe(false);
        }
      }
    };

  const handleSubmit = async () => {
    if (!game) return;

    await onSave(game.id, {
      event: formData.event,
      site: formData.site,
      date: formData.date,
      round: formData.round,
      whiteName: formData.whiteName,
      whiteRating: formData.whiteRating,
      blackName: formData.blackName,
      blackRating: formData.blackRating,
      result: formData.result,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("edit.title")}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label={t("columns.event")}
              fullWidth
              value={formData.event}
              onChange={handleChange("event")}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("columns.site")}
              fullWidth
              value={formData.site}
              onChange={handleChange("site")}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("columns.date")}
              fullWidth
              value={formData.date}
              onChange={handleChange("date")}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t("columns.round")}
              fullWidth
              value={formData.round}
              onChange={handleChange("round")}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label={t("columns.result")}
              fullWidth
              value={formData.result}
              onChange={handleChange("result")}
            >
              <MenuItem value="1-0">1-0 (White won)</MenuItem>
              <MenuItem value="0-1">0-1 (Black won)</MenuItem>
              <MenuItem value="1/2-1/2">1/2-1/2 (Draw)</MenuItem>
              <MenuItem value="*">* (Ongoing/Other)</MenuItem>
            </TextField>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <strong>{t("columns.white")}</strong>
            <FormControlLabel
              control={
                <Checkbox
                  checked={whiteIsMe}
                  onChange={handleMeChange("white")}
                  disabled={blackIsMe}
                />
              }
              label={t("edit.its_me")}
            />
          </Grid>
          <Grid item xs={8}>
            <TextField
              label={t("columns.white")} // Or "Name" if we had key. Reusing column title is safer.
              fullWidth
              value={formData.whiteName}
              onChange={handleChange("whiteName")}
              disabled={whiteIsMe}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Rating" // Using hardcoded or find key? No rating key in columns? Ah, no rating column label.
              fullWidth
              type="number"
              value={formData.whiteRating}
              onChange={handleChange("whiteRating")}
            />
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <strong>{t("columns.black")}</strong>
            <FormControlLabel
              control={
                <Checkbox
                  checked={blackIsMe}
                  onChange={handleMeChange("black")}
                  disabled={whiteIsMe}
                />
              }
              label={t("edit.its_me")}
            />
          </Grid>
          <Grid item xs={8}>
            <TextField
              label={t("columns.black")}
              fullWidth
              value={formData.blackName}
              onChange={handleChange("blackName")}
              disabled={blackIsMe}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Rating"
              fullWidth
              type="number"
              value={formData.blackRating}
              onChange={handleChange("blackRating")}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tCommon("cancel")}</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {t("edit.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
