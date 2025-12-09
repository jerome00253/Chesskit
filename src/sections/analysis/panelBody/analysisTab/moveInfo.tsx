import { Skeleton, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom } from "../../states";
import { useMemo } from "react";
import { moveLineUciToSan } from "@/lib/chess";
import { MoveClassification } from "@/types/enums";
import Image from "next/image";
import PrettyMoveSan from "@/components/prettyMoveSan";

export default function MoveInfo() {
  const position = useAtomValue(currentPositionAtom);
  const board = useAtomValue(boardAtom);
  const t = useTranslations("Analysis");

  const bestMove = position?.lastEval?.bestMove;

  const bestMoveSan = useMemo(() => {
    if (!bestMove) return undefined;

    const lastPosition = board.history({ verbose: true }).at(-1)?.before;
    if (!lastPosition) return undefined;

    return moveLineUciToSan(lastPosition)(bestMove);
  }, [bestMove, board]);

  if (board.history().length === 0) return null;

  if (!bestMoveSan) {
    return (
      <Stack direction="row" alignItems="center" columnGap={5} marginTop={0.8}>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={"12em"}
          sx={{ color: "transparent", maxWidth: "7vw" }}
        >
          <Typography align="center" fontSize="0.9rem">
            placeholder
          </Typography>
        </Skeleton>
      </Stack>
    );
  }

  const moveClassification = position.eval?.moveClassification;

  const showBestMoveLabel =
    moveClassification !== MoveClassification.Best &&
    moveClassification !== MoveClassification.Opening &&
    moveClassification !== MoveClassification.Forced &&
    moveClassification !== MoveClassification.Splendid &&
    moveClassification !== MoveClassification.Perfect;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      columnGap={4}
      marginTop={0.5}
      flexWrap="wrap"
    >
      {moveClassification && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image
            src={`/icons/${moveClassification}.png`}
            alt="move-icon"
            width={16}
            height={16}
            style={{
              maxWidth: "3.5vw",
              maxHeight: "3.5vw",
            }}
          />

          <PrettyMoveSan
            typographyProps={{
              fontSize: "0.9rem",
            }}
            san={position.lastMove?.san ?? ""}
            color={position.lastMove?.color ?? "w"}
            additionalText={" - " + t(`classification.${moveClassification}`)}
          />
        </Stack>
      )}

      {showBestMoveLabel && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image
            src={"/icons/best.png"}
            alt="move-icon"
            width={16}
            height={16}
            style={{
              maxWidth: "3.5vw",
              maxHeight: "3.5vw",
            }}
          />
          <PrettyMoveSan
            typographyProps={{
              fontSize: "0.9rem",
            }}
            san={bestMoveSan}
            color={position.lastMove?.color ?? "w"}
            additionalText={" - " + t("classification.best")}
          />
        </Stack>
      )}
    </Stack>
  );
}
