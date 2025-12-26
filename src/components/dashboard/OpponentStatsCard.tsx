import { Card, CardContent, Typography, Grid2 as Grid, Chip } from "@mui/material";
import { Icon } from "@iconify/react";

interface OpponentStatsCardProps {
  opponent: string;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
}

export function OpponentStatsCard({ opponent, totalGames, wins, draws, losses }: OpponentStatsCardProps) {
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Icon icon="mdi:account-multiple" style={{ marginRight: 8, verticalAlign: "middle" }} />
          Adversaire Principal
        </Typography>
        <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
          {opponent}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {totalGames} partie{totalGames > 1 ? "s" : ""} jouée{totalGames > 1 ? "s" : ""}
        </Typography>
        <Grid container spacing={1} sx={{ mt: 2 }}>
          <Grid>
            <Chip
              icon={<Icon icon="mdi:trophy" />}
              label={`${wins} victoires`}
              color="success"
              size="small"
            />
          </Grid>
          <Grid>
            <Chip
              icon={<Icon icon="mdi:handshake" />}
              label={`${draws} nulles`}
              color="warning"
              size="small"
            />
          </Grid>
          <Grid>
            <Chip
              icon={<Icon icon="mdi:close-circle" />}
              label={`${losses} défaites`}
              color="error"
              size="small"
            />
          </Grid>
        </Grid>
        <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
          {winRate}% de victoires
        </Typography>
      </CardContent>
    </Card>
  );
}
