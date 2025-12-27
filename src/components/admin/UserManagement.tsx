import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export default function UserManagement() {
  const t = useTranslations("Admin"); 
  // We'll need to add "Admin" namespace to messages
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [password, setPassword] = useState(""); // Only for create or reset
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setCurrentUser({ role: "USER" });
    setPassword("");
    setError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (user: User) => {
    setDialogMode("edit");
    setCurrentUser(user);
    setPassword(""); // Optional for edit
    setError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    setError("");
    try {
      const method = dialogMode === "create" ? "POST" : "PUT";
      const body = {
        ...currentUser,
        password: password || undefined,
      };

      const res = await fetch("/api/admin/users/", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Operation failed");
      }

      setSuccess(t("operation_success"));
      fetchUsers();
      handleCloseDialog();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;

    try {
      const res = await fetch("/api/admin/users/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setSuccess(t("user_deleted"));
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title={t("title")}
        action={
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:plus" />}
            onClick={handleOpenCreate}
          >
            {t("add_user")}
          </Button>
        }
      />
      <CardContent>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("name")}</TableCell>
                  <TableCell>{t("email")}</TableCell>
                  <TableCell>{t("role")}</TableCell>
                  <TableCell align="right">{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === "ADMIN" ? "primary" : "default"} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenEdit(user)}>
                        <Icon icon="mdi:pencil" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(user.id)}>
                        <Icon icon="mdi:delete" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialog for Create/Edit */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>
            {dialogMode === "create" ? t("add_user") : t("edit_user")}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1} minWidth={300}>
              {error && <Alert severity="error">{error}</Alert>}
              
              <TextField
                label={t("name")}
                value={currentUser.name || ""}
                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                fullWidth
              />
              <TextField
                label={t("email")}
                value={currentUser.email || ""}
                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>{t("role")}</InputLabel>
                <Select
                  value={currentUser.role || "USER"}
                  label={t("role")}
                  onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value as any })}
                >
                  <MenuItem value="USER">USER</MenuItem>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={dialogMode === "create" ? t("password") : t("new_password_placeholder")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                helperText={t("password_helper")}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t("cancel")}</Button>
            <Button onClick={handleSave} variant="contained">
              {t("save")}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
