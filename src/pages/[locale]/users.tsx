import {
  Box,
  CircularProgress,
  Container,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { PageTitle } from "@/components/pageTitle";
import dynamic from "next/dynamic";

const UserManagement = dynamic(() => import("@/components/admin/UserManagement"), {
  loading: () => <CircularProgress />,
  ssr: false,
});

export async function getStaticPaths() {
  const { getStaticPaths: originalPaths } = await import("@/lib/i18n");
  return originalPaths();
}

export async function getStaticProps(context: any) {
  const { getStaticProps: originalProps } = await import("@/lib/i18n");
  return originalProps(context);
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("Admin");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "ADMIN") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <UserManagement />
    </Container>
  );
}
