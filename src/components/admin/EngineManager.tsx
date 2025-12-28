import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Checkbox,
  LinearProgress,
  Link,
  Snackbar, // Add Snackbar import
} from "@mui/material";
import { Icon } from "@iconify/react";

interface Engine {
  id: number;
  name: string;
  identifier: string;
  version: string;
  type: string;
  filePath: string;
  isActive: boolean;
  isDefault: boolean;
}

interface FoundEngine {
  path: string;
  name: string;
  type: string;
  fileName: string;
  selected: boolean;
  isMultiPart?: boolean; // Added for multi-part detection
  exists?: boolean; // Added for duplicate detection
}

export default function EngineManager() {
  // ... (rest of storage logic is same)
  // Skip to rendering part

  const [engines, setEngines] = useState<Engine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEngine, setEditingEngine] = useState<Engine | null>(null);
  
  // Wizard State
  const [tabValue, setTabValue] = useState(0); // 0 = Manual, 1 = Import
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    tempPath: string;
    originalName: string;
    foundEngines: FoundEngine[];
  } | null>(null);
  const [globalVersion, setGlobalVersion] = useState("17.1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state (Manual)
  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    version: "",
    type: "lite",
    filePath: "",
  });

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  useEffect(() => {
    fetchEngines();
  }, []);

  const fetchEngines = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/engines");
      if (!res.ok) throw new Error("Failed to fetch engines");
      const data = await res.json();
      
      // Client-side sort for better version handling
      const sortedEngines = (data.engines as Engine[]).sort((a, b) => {
          // 1. Default first
          if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
          
          // 2. Version descending (SemVer-ish)
          const vA = a.version.split('.').map(Number);
          const vB = b.version.split('.').map(Number);
          
          for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
              const numA = vA[i] || 0;
              const numB = vB[i] || 0;
              if (numA !== numB) return numB - numA; // Descending
          }
          
          // 3. Name alphabetical
          return a.name.localeCompare(b.name);
      });

      setEngines(sortedEngines);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/engines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Failed to update engine");
      fetchEngines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleToggleDefault = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/engines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Failed to set default engine");
      fetchEngines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [engineToDelete, setEngineToDelete] = useState<number | null>(null);

  const requestDelete = (id: number) => {
    setEngineToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!engineToDelete) return;
    
    try {
      const res = await fetch(`/api/admin/engines/${engineToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete engine");
      
      setSnackbar({ open: true, message: "Moteur supprimé avec succès.", severity: "success" });
      fetchEngines();
    } catch (err) {
      setSnackbar({ open: true, message: "Erreur lors de la suppression: " + (err instanceof Error ? err.message : "Unknown"), severity: "error" });
    } finally {
      setDeleteConfirmOpen(false);
      setEngineToDelete(null);
    }
  };

  const handleOpenDialog = (engine?: Engine) => {
    if (engine) {
      setEditingEngine(engine);
      setFormData({
        name: engine.name,
        identifier: engine.identifier,
        version: engine.version,
        type: engine.type,
        filePath: engine.filePath,
      });
      setTabValue(0); 
    } else {
      setEditingEngine(null);
      setFormData({
        name: "",
        identifier: "",
        version: "",
        type: "lite",
        filePath: "",
      });
      // Reset wizard
      setScanResult(null);
      setGlobalVersion("17.1");
    }
    setDialogOpen(true);
  };

  const handleSaveManual = async () => {
    try {
      const res = await fetch("/api/admin/engines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create engine");
      }
      setDialogOpen(false);
      fetchEngines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // --- WIZARD LOGIC ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setScanResult(null);

    try {
        const res = await fetch("/api/admin/engines/scan-zip", {
            method: "POST",
            body: formData,
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Upload failed");
        }

        const data = await res.json();
        
        // Enhance with selection status and duplicate check
        const enginesWithSelection = data.foundEngines.map((e: any) => {
            // Generate likely identifier to check for duplicates
            // Logic must match import-zip.ts: jsName.replace(".js", "").replace(/[^a-z0-9_]/g, "_").toLowerCase()
            const likelyId = e.fileName.replace(".js", "").replace(/[^a-z0-9_]/g, "_").toLowerCase();
            const exists = engines.some(existing => existing.identifier === likelyId || existing.name === e.name);

            return {
                ...e,
                selected: !exists, // Deselect if exists
                exists: exists,
                // Pre-fill name with version
                name: `Stockfish ${globalVersion} ${e.type === 'lite' ? 'Lite' : ''} ${e.type === 'single' ? 'Single' : ''} ${e.type === 'nnue' ? 'NNUE' : ''}`.trim()
            };
        });

        setScanResult({
            ...data,
            foundEngines: enginesWithSelection
        });

    } catch (err) {
        setSnackbar({ open: true, message: "Erreur lors de l'upload: " + (err instanceof Error ? err.message : "Unknown"), severity: "error" });
    } finally {
        setUploading(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleEngineSelection = (index: number) => {
      if (!scanResult) return;
      const engine = scanResult.foundEngines[index];
      // Allow re-selecting even if exists (user might want to force update/duplicate), 
      // but ideally we should warn. For now let's just toggle.
      // If you want to strictly BLOCK, check engine.exists here.
      // if (engine.exists) return; // Strict blocking removed as requested

      const newEngines = [...scanResult.foundEngines];
      newEngines[index].selected = !newEngines[index].selected;
      setScanResult({
          ...scanResult,
          foundEngines: newEngines
      });
  };

  const handleImport = async () => {
      if (!scanResult) return;

      const selectedEngines = scanResult.foundEngines.filter(e => e.selected);
      if (selectedEngines.length === 0) {
          setSnackbar({ open: true, message: "Veuillez sélectionner au moins un moteur.", severity: "error" });
          return;
      }

      setUploading(true);
      try {
          const res = await fetch("/api/admin/engines/import-zip", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  tempPath: scanResult.tempPath,
                  originalName: scanResult.originalName,
                  engines: scanResult.foundEngines,
                  globalVersion: globalVersion
              })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Import failed"); 
          }

          const data = await res.json();
          setSnackbar({ open: true, message: `Succès ! ${data.created} moteurs importés.`, severity: "success" });
          setDialogOpen(false);
          fetchEngines();

      } catch (err) {
        setSnackbar({ open: true, message: "Erreur lors de l'import: " + (err instanceof Error ? err.message : "Unknown"), severity: "error" });
      } finally {
          setUploading(false);
      }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Icon icon="mdi:chip" width={28} />
            <Typography variant="h6">Gestion des Moteurs</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:plus" />}
            onClick={() => handleOpenDialog()}
          >
            Ajouter Moteur
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Actif</TableCell>
                <TableCell align="center">Par défaut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {engines.map((engine) => (
                <TableRow key={engine.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={engine.isDefault ? "bold" : "normal"}>
                      {engine.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {engine.identifier}
                    </Typography>
                  </TableCell>
                  <TableCell>{engine.version}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: engine.type === "lite" ? "success.light" : "info.light",
                        color: "white",
                        display: "inline-block",
                        fontSize: "0.75rem",
                      }}
                    >
                      {engine.type}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={engine.isActive}
                      onChange={() => handleToggleActive(engine.id, engine.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleToggleDefault(engine.id)}
                      color={engine.isDefault ? "primary" : "default"}
                      disabled={engine.isDefault}
                    >
                      <Icon icon={engine.isDefault ? "mdi:star" : "mdi:star-outline"} />
                    </IconButton>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => requestDelete(engine.id)} color="error">
                      <Icon icon="mdi:delete" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingEngine ? "Modifier" : "Ajouter"} un Moteur</DialogTitle>
          <DialogContent>
            
            {!editingEngine && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab label="Manuel" />
                        <Tab label="Import ZIP (Wizard)" />
                    </Tabs>
                </Box>
            )}

            {/* TAB 0: MANUAL */}
            {tabValue === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                    <TextField
                        label="Nom"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        placeholder="Ex: Stockfish 17.1"
                    />
                    <TextField
                        label="Identifiant"
                        value={formData.identifier}
                        onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                        fullWidth
                        placeholder="Ex: stockfish_17_1"
                        helperText="Identifiant unique (snake_case)"
                        disabled={!!editingEngine}
                    />
                    <TextField
                        label="Version"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        fullWidth
                        placeholder="Ex: 17.1"
                    />
                    <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        label="Type"
                        >
                        <MenuItem value="lite">Lite</MenuItem>
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="nnue">NNUE</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Chemin du fichier"
                        value={formData.filePath}
                        onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                        fullWidth
                        placeholder="/engines/stockfish-17.1/stockfish.js"
                        helperText="Chemin relatif depuis /public"
                    />
                </Box>
            )}

            {/* TAB 1: WIZARD */}
            {tabValue === 1 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                    
                    {!scanResult ? (
                        <>
                            <Alert severity="info" sx={{ mb: 1 }}>
                                Téléchargez les fichiers officiels ici :
                                {" "}
                                <Link href="https://github.com/nmrugg/stockfish.js/releases" target="_blank" rel="noopener">
                                    Releases Stockfish.js
                                </Link>
                            </Alert>
                            
                            <TextField
                                label="Version Globale"
                                value={globalVersion}
                                onChange={(e) => setGlobalVersion(e.target.value)}
                                fullWidth
                                helperText="Sera appliquée à tous les moteurs importés"
                            />

                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<Icon icon="mdi:upload" />}
                                disabled={uploading}
                            >
                                {uploading ? "Chargement..." : "Choisir un fichier ZIP"}
                                <input
                                    type="file"
                                    hidden
                                    accept=".zip"
                                    onChange={handleFileUpload}
                                    ref={fileInputRef}
                                />
                            </Button>
                            {uploading && <LinearProgress />}
                        </>
                    ) : (
                        <>
                            <Alert severity="success">
                                {scanResult.foundEngines.length} moteurs détectés !
                            </Alert>

                            <TableContainer sx={{ maxHeight: 300 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                            </TableCell>
                                            <TableCell>Nom suggéré</TableCell>
                                            <TableCell>Fichier</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {scanResult.foundEngines.map((engine, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={engine.selected}
                                                        onChange={() => toggleEngineSelection(idx)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField 
                                                        size="small"
                                                        value={engine.name}
                                                        onChange={(e) => {
                                                            const newEngines = [...scanResult.foundEngines];
                                                            newEngines[idx].name = e.target.value;
                                                            setScanResult({...scanResult, foundEngines: newEngines});
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{engine.fileName}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                        {engine.isMultiPart && (
                                                            <Box component="span" sx={{ fontSize: '0.7rem', bgcolor: 'info.light', color: 'white', px: 0.5, borderRadius: 0.5 }}>
                                                                Multi-part
                                                            </Box>
                                                        )}
                                                        {engine.exists && (
                                                            <Box component="span" sx={{ fontSize: '0.7rem', bgcolor: 'error.light', color: 'white', px: 0.5, borderRadius: 0.5 }}>
                                                                Déjà installé
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Button 
                                variant="text" 
                                color="error" 
                                onClick={() => {
                                    setScanResult(null);
                                    if(fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            >
                                Recommencer / Choisir un autre fichier
                            </Button>
                        </>
                    )}

                </Box>
            )}

          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={uploading}>Annuler</Button>
            {tabValue === 0 ? (
                <Button onClick={handleSaveManual} variant="contained">
                    Enregistrer
                </Button>
            ) : (
                <Button 
                    onClick={handleImport} 
                    variant="contained" 
                    disabled={!scanResult || uploading}
                >
                    {uploading ? "Importation..." : "Importer la sélection"}
                </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogContent>
                <Typography>Êtes-vous sûr de vouloir supprimer ce moteur ? Cette action est irréversible et supprimera les fichiers associés.</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
                <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
                    Supprimer
                </Button>
            </DialogActions>
        </Dialog>

        {/* Global Snackbar */}
        <Snackbar 
            open={snackbar.open} 
            autoHideDuration={6000} 
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
            </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}
