import { atom } from "jotai";
import { Game } from "@/types/game";

export const gamesAtom = atom<Game[]>([]);
export const fetchGamesAtom = atom<boolean>(false);
