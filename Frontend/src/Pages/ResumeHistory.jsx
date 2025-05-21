"use client";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Card,
  CardContent,
  TablePagination,
  Backdrop,
} from "@mui/material";
import { useState, useEffect } from "react";
import { PDFDownloadLink, BlobProvider } from "@react-pdf/renderer";
import ResumePDF from "./ResumePreview";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import { generateResumeDocx } from "./DocxGenerator";

export default function ResumeHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const token = localStorage.getItem("token");

  // Fetch resume history
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:8000/resume/history?limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch resume history");
        }

        const data = await response.json();
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "An error occurred while fetching history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  // Handle resume deletion confirmation
  const handleOpenDeleteDialog = (resume) => {
    setSelectedResume(resume);
    setOpenDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDialog(false);
  };

  // Delete resume from history
  const handleDeleteResume = async () => {
    if (!selectedResume) return;

    try {
      const response = await fetch(
        `http://localhost:8000/resume/history/${selectedResume.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete resume");
      }

      // Remove from state
      setHistory(history.filter((item) => item.id !== selectedResume.id));
      setOpenDialog(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete resume");
    }
  };

  // View resume details
  const handleViewResume = async (resumeId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/resume/history/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch resume details");
      }

      const data = await response.json();
      setSelectedResume(data);
      setOpenPreview(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load resume details");
    } finally {
      setLoading(false);
    }
  };

  // Handle DOCX download
  const handleDownloadDocx = async () => {
    if (!selectedResume || !selectedResume.resume_data) return;

    setDownloadingDocx(true);
    try {
      await generateResumeDocx(selectedResume.resume_data);
    } catch (err) {
      setError(err.message || "DOCX download error");
      console.error(err);
    } finally {
      setDownloadingDocx(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    return (bytes / 1024).toFixed(1) + " KB";
  };

  // Handle pagination changes
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={3} sx={{ backgroundColor: "#f1f5f9" }}>
      <Card
        sx={{
          maxWidth: 1200,
          margin: "auto",
          p: 3,
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h5" sx={{ color: "black", fontWeight: 600 }}>
              Resume History
            </Typography>
          </Box>

          {loading && !openPreview ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
              }}
            >
              <CircularProgress sx={{ color: "#1e3a8a" }} />
            </Box>
          ) : error ? (
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: "#fee2e2",
                mb: 3,
              }}
            >
              <Typography color="error">{error}</Typography>
            </Paper>
          ) : history.length === 0 ? (
            <Paper
              sx={{
                p: 5,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: "#f8fafc",
                border: "1px dashed #94a3b8",
              }}
            >
              <Typography variant="h6" sx={{ color: "#64748b", mb: 2 }}>
                No Resume History Found
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>File Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Date Processed
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, width: "140px" }}
                        align="center"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((resume) => (
                        <TableRow
                          key={resume.id}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            "&:hover": { backgroundColor: "#f8fafc" },
                          }}
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                maxWidth: 250,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {resume.filename}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(resume.processed_at)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                resume.original_file_type?.toUpperCase() ||
                                "Unknown"
                              }
                              sx={{
                                backgroundColor:
                                  resume.original_file_type === "pdf"
                                    ? "#fef2f2"
                                    : resume.original_file_type === "docx"
                                    ? "#eff6ff"
                                    : resume.original_file_type === "doc"
                                    ? "#f0f9ff"
                                    : "#f8fafc",
                                color:
                                  resume.original_file_type === "pdf"
                                    ? "#b91c1c"
                                    : resume.original_file_type === "docx"
                                    ? "#1e40af"
                                    : resume.original_file_type === "doc"
                                    ? "#0e7490"
                                    : "#475569",
                                borderRadius: 1,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {formatFileSize(resume.file_size)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={resume.status.toUpperCase() || "COMPLETED"}
                              sx={{
                                backgroundColor:
                                  resume.status === "completed"
                                    ? "#ecfdf5"
                                    : "#fef2f2",
                                color:
                                  resume.status === "completed"
                                    ? "#047857"
                                    : "#b91c1c",
                                borderRadius: 1,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 1.5,
                              }}
                            >
                              <Tooltip title="View Resume">
                                <IconButton
                                  color="primary"
                                  onClick={() => handleViewResume(resume.id)}
                                  disabled={resume.status !== "completed"}
                                  sx={{
                                    "&.Mui-disabled": {
                                      color: "#94a3b8",
                                    },
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(resume)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={history.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Resume</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete &quot;
            {selectedResume?.filename}&quot; from your history? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              color: "#64748b",
              "&:hover": { backgroundColor: "#f8fafc" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteResume}
            color="error"
            variant="contained"
            sx={{
              borderRadius: 1,
              backgroundColor: "#dc2626",
              "&:hover": { backgroundColor: "#b91c1c" },
            }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resume Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            height: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e2e8f0",
            p: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Resume Preview
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            {selectedResume?.resume_data && (
              <>
                <PDFDownloadLink
                  document={<ResumePDF data={selectedResume.resume_data} />}
                  fileName={`${selectedResume.filename || "resume"}.pdf`}
                  style={{ textDecoration: "none" }}
                >
                  {({ loading: pdfLoading }) => (
                    <Button
                      variant="contained"
                      color="success"
                      disabled={pdfLoading}
                      size="small"
                      startIcon={<PictureAsPdfIcon />}
                      sx={{
                        borderRadius: 1,
                        backgroundColor: "#047857",
                        "&:hover": {
                          backgroundColor: "#065f46",
                        },
                      }}
                    >
                      {pdfLoading ? "Preparing..." : "Download PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDownloadDocx}
                  disabled={downloadingDocx}
                  size="small"
                  startIcon={<DescriptionIcon />}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: "#1e3a8a",
                    "&:hover": {
                      backgroundColor: "#1e40af",
                    },
                  }}
                >
                  {downloadingDocx ? "Preparing..." : "Download DOCX"}
                </Button>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          {selectedResume?.resume_data ? (
            <BlobProvider
              document={<ResumePDF data={selectedResume.resume_data} />}
            >
              {({ url, loading: previewLoading }) =>
                previewLoading ? (
                  <Box
                    height="100%"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{ backgroundColor: "#f8fafc", p: 4 }}
                  >
                    <CircularProgress sx={{ color: "#1e3a8a" }} />
                  </Box>
                ) : (
                  <iframe
                    src={url}
                    title="PDF Preview"
                    width="100%"
                    height="100%"
                    style={{ border: "none", flexGrow: 1 }}
                  />
                )
              }
            </BlobProvider>
          ) : (
            <Box
              sx={{
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                backgroundColor: "#f8fafc",
              }}
            >
              <Typography variant="h6" sx={{ color: "#64748b", mb: 2 }}>
                Resume data not available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
          <Button
            onClick={() => setOpenPreview(false)}
            sx={{
              borderRadius: 1,
              color: "#1e3a8a",
              borderColor: "#1e3a8a",
              "&:hover": {
                borderColor: "#1e40af",
                backgroundColor: "#f1f5f9",
              },
            }}
            variant="outlined"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading backdrop */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && openPreview}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
