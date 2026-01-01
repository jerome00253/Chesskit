import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import { useEffect, useState } from "react";
import NavMenu from "./NavMenu";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import NavLink from "@/components/NavLink";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useSession, signOut } from "next-auth/react";
import { LOCALE_LABELS, type SupportedLocale } from "@/types/locale";
import { getChessComStats } from "@/lib/chessCom";
import { getLichessUserPublic } from "@/lib/lichess";
import { Tooltip, Chip } from "@mui/material";

interface Props {
  darkMode: boolean;
  switchDarkMode: () => void;
}

export default function NavBar({ darkMode, switchDarkMode }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations("NavBar");

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    handleMenuClose();
    router.push(path);
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [router.pathname]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <AppBar
        position="static"
        sx={{
          backgroundColor: darkMode ? "#19191c" : "white",
          color: darkMode ? "white" : "black",
        }}
        enableColorOnDark
      >
        <Toolbar variant="dense">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: "min(0.5vw, 0.6rem)", padding: 1, my: 1 }}
            onClick={() => setDrawerOpen((val) => !val)}
          >
            <Icon icon="mdi:menu" />
          </IconButton>

          <Image
            src="/favicon-32x32.png"
            alt="Chesskit+ logo"
            width={32}
            height={32}
          />

          <NavLink href="/">
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                ml: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                Chesskit+
              </Typography>
            </Box>
          </NavLink>

          {/* ELO Badges */}
          {session?.user && (
            <Box sx={{ display: { xs: "none", md: "flex" }, ml: 2, gap: 1, alignItems: "center" }}>
               {/* Chesskit */}
               <Tooltip title="Chesskit ELO">
                   <Chip 
                    icon={<Icon icon="mdi:chess-pawn" />} 
                    label={(session.user as any).rating || 1200} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                   />
               </Tooltip>

               {/* Chess.com */}
               <ChessComBadge username={(session.user as any).chesscomUsername} />

               {/* Lichess */}
               <LichessBadge username={(session.user as any).lichessUsername} />
            </Box>
          )}

          {/* Language Indicator */}
          <IconButton
            onClick={() => handleNavigate("/profile")}
            sx={{ ml: 1, fontSize: "1.2rem" }}
            title={t("profile")}
          >
            {LOCALE_LABELS[
              (router.locale ||
                router.asPath.split("/")[1] ||
                "en") as SupportedLocale
            ]?.flag || "🇬🇧"}
          </IconButton>

          {/* Authentication Controls */}
          <Box sx={{ ml: 2, display: "flex", alignItems: "center", gap: 1 }}>
            {status === "loading" ? null : status === "authenticated" ? (
              <>
                <IconButton
                  onClick={handleMenuClick}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={menuOpen ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? "true" : undefined}
                >
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
                  >
                    {session.user?.name?.charAt(0).toUpperCase() ||
                      session.user?.email?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={menuOpen}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem onClick={() => handleNavigate("/profile")}>
                    <ListItemIcon>
                      <Icon icon="mdi:account" width={20} />
                    </ListItemIcon>
                    {t("profile")}
                  </MenuItem>
                  {session?.user?.role === "ADMIN" && (
                    <MenuItem onClick={() => handleNavigate("/users")}>
                      <ListItemIcon>
                        <Icon icon="mdi:account-group" width={20} />
                      </ListItemIcon>
                      {t("users")}
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => handleNavigate("/settings")}>
                    <ListItemIcon>
                      <Icon icon="mdi:cog" width={20} />
                    </ListItemIcon>
                    {t("settings")}
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => signOut()}>
                    <ListItemIcon>
                      <Icon icon="mdi:logout" width={20} />
                    </ListItemIcon>
                    {t("logout")}
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <NavLink href="/login">
                <Icon icon="mdi:login" />
              </NavLink>
            )}
          </Box>

          <IconButton
            sx={{ ml: "min(0.6rem, 0.8vw)" }}
            onClick={switchDarkMode}
            color="inherit"
            edge="end"
          >
            {darkMode ? (
              <Icon icon="mdi:brightness-7" />
            ) : (
              <Icon icon="mdi:brightness-4" />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      <NavMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}

const ChessComBadge = ({ username }: { username?: string | null }) => {
    const [rating, setRating] = useState<number | null>(null);

    useEffect(() => {
        if (username) {
            getChessComStats(username).then(stats => {
                if (stats?.chess_rapid?.last?.rating) {
                    setRating(stats.chess_rapid.last.rating);
                }
            });
        }
    }, [username]);

    if (!rating) return null;

    return (
        <Tooltip title={`Chess.com Rapid: ${username}`}>
            <Chip 
             icon={<Icon icon="simple-icons:chessdotcom" color="#7fa650" />}
             label={rating} 
             size="small" 
             variant="outlined"
             sx={{ borderColor: '#7fa650', color: '#7fa650', '& .MuiChip-label': { px: 1 } }}
            />
        </Tooltip>
    );
};

const LichessBadge = ({ username }: { username?: string | null }) => {
    const [rating, setRating] = useState<number | null>(null);

    useEffect(() => {
        if (username) {
            getLichessUserPublic(username).then(user => {
                if (user?.perfs?.rapid?.rating) {
                    setRating(user.perfs.rapid.rating);
                }
            });
        }
    }, [username]);

    if (!rating) return null;

    return (
        <Tooltip title={`Lichess Rapid: ${username}`}>
             <Chip 
             icon={<Icon icon="simple-icons:lichess" color="#999" />}
             label={rating} 
             size="small" 
             variant="outlined"
             sx={{ borderColor: '#999', color: '#999', '& .MuiChip-label': { px: 1 } }}
            />
        </Tooltip>
    );
};
