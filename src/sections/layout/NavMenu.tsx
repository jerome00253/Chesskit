import NavLink from "@/components/NavLink";
import { Icon } from "@iconify/react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NavMenu({ open, onClose }: Props) {
  const t = useTranslations("Navigation");

  const MenuOptions = [
    { text: t("play"), icon: "streamline:chess-pawn", href: "/play" },
    {
      text: t("analysis"),
      icon: "streamline:magnifying-glass-solid",
      href: "/",
    },
    {
      text: t("database"),
      icon: "streamline:database",
      href: "/database",
    },
  ];

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Toolbar />
      <Box sx={{ width: 250, overflow: "hidden" }}>
        <List>
          {MenuOptions.map(({ text, icon, href }) => (
            <ListItem key={text} disablePadding sx={{ margin: 0.7 }}>
              <NavLink href={href}>
                <ListItemButton onClick={onClose}>
                  <ListItemIcon style={{ paddingLeft: "0.5em" }}>
                    <Icon icon={icon} height="1.5em" />
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </NavLink>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
