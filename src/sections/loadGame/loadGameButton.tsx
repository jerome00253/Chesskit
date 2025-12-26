import { Button } from "@mui/material";
import { useState } from "react";
import NewGameDialog from "./loadGameDialog";
import { Chess } from "chess.js";
import { useTranslations } from "next-intl";

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
      >
        <p>{label || t("addGame")}</p>
      </Button>
      <NewGameDialog
        open={open}
        onClose={() => setOpen(false)}
        setGame={setGame}
      />
    </>
  );
}
