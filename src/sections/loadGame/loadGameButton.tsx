import { Button, Typography } from "@mui/material";
import { useState } from "react";
import NewGameDialog from "./loadGameDialog";
import { Chess } from "chess.js";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";

interface Props {
  setGame?: (game: Chess) => Promise<void>;
  label?: string;
  size?: "small" | "medium" | "large";
}

export default function LoadGameButton({ setGame, label, size }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Database");

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        size={size}
        startIcon={<Icon icon="mdi:folder-open" width={12} height={12} />}
        sx={{
          "& .MuiButton-startIcon": {
            marginRight: 0.5,
          },
        }}
      >
        <Typography variant="body1" fontSize="0.85rem">
          {label || t("addGame")}
        </Typography>
      </Button>
      <NewGameDialog
        open={open}
        onClose={() => setOpen(false)}
        setGame={setGame}
      />
    </>
  );
}
