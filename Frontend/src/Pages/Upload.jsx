"use client";

import {
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Paper,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDownloadLink, BlobProvider } from "@react-pdf/renderer";
import ResumePDF from "./ResumePreview";
import ResumeHistory from "./ResumeHistory";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DownloadIcon from "@mui/icons-material/Download";
import HistoryIcon from "@mui/icons-material/History";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ErrorIcon from "@mui/icons-material/Error";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PreviewIcon from "@mui/icons-material/Preview";
import { generateResumeDocx } from "./DocxGenerator";

const CustomTabStyle = {
  fontWeight: 600,
  minHeight: 48,
  fontSize: 16,
  textTransform: "none",
  "&.Mui-selected": {
    color: "#1e3a8a",
  },
};

const tabs = ["Upload Resume", "Preview & Download", "Resume History"];

export default function Upload() {
  // File handling states
  const [uploadMode, setUploadMode] = useState("single"); // "single" or "multiple"
  const [files, setFiles] = useState([]); // Array of files for multiple upload
  const [file, setFile] = useState(null); // Single file for backward compatibility
  const [useVision, setUseVision] = useState(true); // Toggle for vision vs text processing

  // Processing states
  const [jsonData, setJsonData] = useState(null);
  const [multipleJsonData, setMultipleJsonData] = useState([]); // Array of processed data for multiple files
  const [loading, setLoading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [currentProcessingFile, setCurrentProcessingFile] = useState("");

  // Batch processing states
  const [batchId, setBatchId] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);

  // Preview states for multiple files
  const [expandedPreviews, setExpandedPreviews] = useState(new Set());

  // Success states
  const [successMessage, setSuccessMessage] = useState("");
  const [openSuccessAlert, setOpenSuccessAlert] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [docxDownloaded, setDocxDownloaded] = useState(false);

  const token = localStorage.getItem("token");

  // Reset states when component unmounts or activeTab changes
  useEffect(() => {
    return () => {
      setLoading(false);
      setUploading(false);
      setProcessing(false);
    };
  }, [activeTab]);

  // Reset downloaded states when going back to upload
  useEffect(() => {
    if (activeTab === 0) {
      setPdfDownloaded(false);
      setDocxDownloaded(false);
    }
  }, [activeTab]);

  // Reset files when switching upload modes
  useEffect(() => {
    setFiles([]);
    setFile(null);
    setJsonData(null);
    setMultipleJsonData([]);
    setBatchId(null);
    setBatchProgress(null);
    setExpandedPreviews(new Set());
    setError(null);
  }, [uploadMode]);

  const simulateProgressForStage = async (
    startPercent,
    endPercent,
    stageName
  ) => {
    setProcessingStage(stageName);
    const increment = (endPercent - startPercent) / 10;
    let currentProgress = startPercent;

    for (let i = 0; i < 10; i++) {
      currentProgress += increment;
      setUploadProgress(Math.round(currentProgress));
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  };

  const checkProgressStatus = async (taskId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/resume/progress/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      if (response.ok) {
        const statusData = await response.json();
        return statusData;
      }
      return null;
    } catch (error) {
      console.error("Error checking progress:", error);
      return null;
    }
  };

  const checkBatchProgress = async (batchId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/resume/batch-progress/${batchId}`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      if (response.ok) {
        const batchData = await response.json();
        return batchData;
      }
      return null;
    } catch (error) {
      console.error("Error checking batch progress:", error);
      return null;
    }
  };

  const handleUpload = async () => {
    const filesToProcess = uploadMode === "single" ? [file] : files;
    if (filesToProcess.length === 0) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);
    setUploading(true);
    setProcessing(false);
    setProcessingStage("Starting upload...");

    try {
      // Create FormData with files
      const form = new FormData();

      if (uploadMode === "single") {
        form.append("file", file);
      } else {
        // Append multiple files as per your backend expectation
        filesToProcess.forEach((fileItem) => {
          form.append("files", fileItem);
        });
      }

      setUploading(false);
      setProcessing(true);

      // Simulate upload progress
      await simulateProgressForStage(0, 20, "Uploading files...");

      // Send to appropriate endpoint
      const endpoint =
        uploadMode === "multiple"
          ? `http://localhost:8000/resume/upload-multiple?use_vision=${useVision}`
          : `http://localhost:8000/resume/upload?use_vision=${useVision}`;

      const uploadResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: form,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const responseData = await uploadResponse.json();

      if (uploadMode === "single") {
        // Handle single file response
        const { task_id } = responseData;

        const progressStages = {
          upload: { start: 20, end: 40, label: "Processing upload..." },
          converting_docx_to_pdf_with_aspose: {
            start: 40,
            end: 50,
            label: "Converting document...",
          },
          high_quality_image_conversion: {
            start: 50,
            end: 60,
            label: "Converting to images...",
          },
          comprehensive_vision_analysis: {
            start: 60,
            end: 80,
            label: "Analyzing with vision...",
          },
          enhanced_text_extraction_with_tables: {
            start: 50,
            end: 70,
            label: "Extracting text...",
          },
          comprehensive_parsing_analysis: {
            start: 70,
            end: 90,
            label: "Parsing resume...",
          },
          completion: { start: 90, end: 100, label: "Finalizing..." },
        };

        let processingComplete = false;
        let resultData = null;

        while (!processingComplete) {
          const statusData = await checkProgressStatus(task_id);

          if (!statusData) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          if (statusData.stage && progressStages[statusData.stage]) {
            const stage = progressStages[statusData.stage];
            setProcessingStage(stage.label);

            const stageProgress = statusData.progress || 0;
            const actualProgress =
              stage.start + ((stage.end - stage.start) * stageProgress) / 100;
            setUploadProgress(Math.round(actualProgress));
          }

          if (statusData.status === "completed") {
            processingComplete = true;
            resultData = statusData.data;
            setUploadProgress(100);
            setProcessingStage("Completed!");
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "Processing failed");
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        setJsonData(resultData);
      } else {
        // Handle multiple files response
        const { batch_id, task_ids } = responseData;
        setBatchId(batch_id);

        setProcessingStage("Processing multiple files...");
        setCurrentProcessingFile(
          `Processing ${filesToProcess.length} files...`
        );

        let batchComplete = false;

        while (!batchComplete) {
          const batchData = await checkBatchProgress(batch_id);

          if (!batchData) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          setBatchProgress(batchData);
          setUploadProgress(Math.round(batchData.overall_progress));

          // Update current processing file info
          const processingFiles = batchData.files.filter(
            (f) => f.status === "processing"
          );
          if (processingFiles.length > 0) {
            setCurrentProcessingFile(
              `Processing: ${processingFiles[0].filename}`
            );
          }

          if (batchData.status === "completed") {
            batchComplete = true;
            setProcessingStage("All files completed!");

            // Extract completed results
            const results = batchData.files
              .filter((f) => f.status === "completed" && f.data)
              .map((f) => ({
                fileName: f.filename,
                data: f.data,
                taskId: f.task_id,
              }));

            setMultipleJsonData(results);
          } else if (batchData.status === "failed") {
            // Check if any files completed successfully
            const completedFiles = batchData.files.filter(
              (f) => f.status === "completed" && f.data
            );
            const failedFiles = batchData.files.filter(
              (f) => f.status === "failed"
            );

            if (completedFiles.length > 0) {
              const results = completedFiles.map((f) => ({
                fileName: f.filename,
                data: f.data,
                taskId: f.task_id,
              }));
              setMultipleJsonData(results);

              setError(
                `${failedFiles.length} file(s) failed to process, but ${completedFiles.length} completed successfully.`
              );
            } else {
              throw new Error("All files failed to process");
            }
            batchComplete = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      await new Promise((res) => setTimeout(res, 300));
      setProcessing(false);

      const successMsg =
        uploadMode === "single"
          ? "Resume successfully processed! You can now download your formatted resume."
          : `${
              uploadMode === "multiple" ? multipleJsonData.length : 1
            } resume(s) successfully processed! You can now download your formatted resumes.`;

      setSuccessMessage(successMsg);
      setOpenSuccessAlert(true);
      setActiveTab(1);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Upload error");
      setUploading(false);
      setProcessing(false);
      setLoading(false);
    }
  };

  const handleDownloadDocx = async (data = null, fileName = null) => {
    const dataToUse = data || jsonData;
    if (!dataToUse) return;

    setDownloadingDocx(true);
    try {
      await generateResumeDocx(dataToUse, fileName);
      setDocxDownloaded(true);
      setSuccessMessage("DOCX file successfully downloaded!");
      setOpenSuccessAlert(true);
    } catch (err) {
      setError(err.message || "DOCX download error");
      console.error(err);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handlePdfDownloaded = () => {
    setPdfDownloaded(true);
    setSuccessMessage("PDF file successfully downloaded!");
    setOpenSuccessAlert(true);
  };

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSuccessAlert(false);
  };

  const handleHistoryItemSelect = useCallback((resumeData) => {
    setJsonData(resumeData);
    setActiveTab(1);
    setSuccessMessage("Resume loaded from history!");
    setOpenSuccessAlert(true);
    setPdfDownloaded(false);
    setDocxDownloaded(false);
  }, []);

  const togglePreview = (index) => {
    const newExpanded = new Set(expandedPreviews);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPreviews(newExpanded);
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        if (uploadMode === "single") {
          setFile(acceptedFiles[0]);
        } else {
          // Check file limit for multiple uploads (max 10 as per backend)
          const newFiles = [...files, ...acceptedFiles];
          if (newFiles.length > 10) {
            setError("Maximum 10 files allowed for batch upload");
            return;
          }
          setFiles(newFiles);
        }
        setError(null);
      }
    },
    [uploadMode, files]
  );

  const removeFile = (indexToRemove) => {
    if (uploadMode === "single") {
      setFile(null);
    } else {
      setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    onDrop,
    multiple: uploadMode === "multiple",
  });

  const getFileIcon = (fileName = "") => {
    if (!fileName) return <UploadFileIcon fontSize="large" />;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf")
      return <PictureAsPdfIcon color="error" fontSize="large" />;
    if (["doc", "docx"].includes(ext))
      return <DescriptionIcon color="primary" fontSize="large" />;
    return <UploadFileIcon fontSize="large" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon color="success" />;
      case "failed":
        return <ErrorIcon color="error" />;
      case "processing":
        return <CircularProgress size={20} />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const currentFiles = uploadMode === "single" ? (file ? [file] : []) : files;
  const hasFiles = currentFiles.length > 0;
  const hasProcessedData =
    uploadMode === "single" ? !!jsonData : multipleJsonData.length > 0;

  return (
    <Box p={3} sx={{ backgroundColor: "#f1f5f9" }}>
      <Card
        sx={{
          maxWidth: 900,
          margin: "auto",
          p: 3,
          backgroundColor: "#ffffff",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              color: "black",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Resume Formatter
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#1e3a8a",
                  height: 3,
                },
              }}
            >
              <Tab
                icon={<FileUploadIcon />}
                iconPosition="start"
                label={tabs[0]}
                disabled={uploading || processing}
                sx={CustomTabStyle}
              />
              <Tab
                icon={<DownloadIcon />}
                iconPosition="start"
                label={tabs[1]}
                disabled={!hasProcessedData}
                sx={CustomTabStyle}
              />
              <Tab
                icon={<HistoryIcon />}
                iconPosition="start"
                label={tabs[2]}
                sx={CustomTabStyle}
              />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box>
              {/* Upload Mode Toggle */}
              <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <ToggleButtonGroup
                  value={uploadMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setUploadMode(newMode)}
                  sx={{
                    "& .MuiToggleButton-root": {
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      "&.Mui-selected": {
                        backgroundColor: "#1e3a8a",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#1e40af",
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="single" sx={{ mr: 5 }}>
                    <InsertDriveFileIcon sx={{ mr: 1 }} />
                    Single File
                  </ToggleButton>
                  <ToggleButton value="multiple">
                    <FolderIcon sx={{ mr: 1 }} />
                    Multiple Files
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Dropzone */}
              <Box
                sx={{
                  border: "2px dashed #94a3b8",
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  cursor: "pointer",
                  mb: 3,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#1e3a8a",
                    backgroundColor: "#f1f5f9",
                  },
                }}
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon
                  sx={{ color: "#1e3a8a", fontSize: 48, mb: 1 }}
                />
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                  {isDragActive
                    ? `Drop your ${
                        uploadMode === "single" ? "file" : "files"
                      } here...`
                    : hasFiles
                    ? `${currentFiles.length} file${
                        currentFiles.length > 1 ? "s" : ""
                      } selected`
                    : `Drag & drop your resume ${
                        uploadMode === "single" ? "file" : "files"
                      } here or click to browse`}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Supported formats: PDF, DOC, DOCX
                  {uploadMode === "multiple" && " • Max 10 files"}
                </Typography>
              </Box>

              {/* File List */}
              {hasFiles && (
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    mb: 3,
                    backgroundColor: "#f8fafc",
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  <List dense>
                    {currentFiles.map((fileItem, index) => (
                      <div key={index}>
                        <ListItem>
                          <Box sx={{ mr: 2 }}>{getFileIcon(fileItem.name)}</Box>
                          <ListItemText
                            primary={fileItem.name}
                            secondary={`${(fileItem.size / 1024).toFixed(
                              1
                            )} KB`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => removeFile(index)}
                              size="small"
                            ></IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < currentFiles.length - 1 && <Divider />}
                      </div>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Progress */}
              {(uploading || processing) && (
                <Box sx={{ width: "100%", mb: 2 }}>
                  <Typography
                    variant="body2"
                    align="center"
                    gutterBottom
                    fontWeight={500}
                  >
                    {currentProcessingFile || processingStage} ({uploadProgress}
                    %)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#1e3a8a",
                      },
                    }}
                  />

                  {/* Batch Progress Details */}
                  {uploadMode === "multiple" && batchProgress && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        Completed: {batchProgress.completed_files}/
                        {batchProgress.total_files}
                        {batchProgress.failed_files > 0 &&
                          ` • Failed: ${batchProgress.failed_files}`}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Upload Button */}
              <Box
                mt={3}
                display="flex"
                gap={2}
                justifyContent="center"
                flexWrap="wrap"
              >
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!hasFiles || loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: "#1e3a8a",
                    "&:hover": {
                      backgroundColor: "#1e40af",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "#94a3b8",
                      color: "#f8fafc",
                    },
                  }}
                >
                  {loading
                    ? "Processing..."
                    : `Upload ${
                        uploadMode === "single"
                          ? "Resume"
                          : `${currentFiles.length} Resume${
                              currentFiles.length > 1 ? "s" : ""
                            }`
                      }`}
                </Button>
              </Box>

              {error && (
                <Typography
                  color="error"
                  sx={{
                    mt: 2,
                    textAlign: "center",
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#fee2e2",
                  }}
                >
                  {error}
                </Typography>
              )}
            </Box>
          )}

          {activeTab === 1 && hasProcessedData && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#ecfdf5",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  border: "1px solid #d1fae5",
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircleIcon sx={{ color: "#059669" }} />
                  <Typography
                    variant="h6"
                    sx={{ color: "#047857", fontWeight: 600 }}
                  >
                    {uploadMode === "single"
                      ? "Resume Successfully Processed!"
                      : `${multipleJsonData.length} Resume(s) Successfully Processed!`}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: "#065f46", width: "100%" }}
                >
                  Your resume{uploadMode === "multiple" ? "s have" : " has"}{" "}
                  been formatted. Choose your preferred download format below.
                </Typography>
              </Paper>

              {/* Single File Preview */}
              {uploadMode === "single" && jsonData && (
                <>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 3,
                      borderRadius: 2,
                      backgroundColor: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: "#1e3a8a", fontWeight: 600 }}
                    >
                      Preview Your Resume
                    </Typography>

                    <Box display="flex" gap={2}>
                      <PDFDownloadLink
                        document={<ResumePDF data={jsonData} />}
                        fileName={`${jsonData.name || "resume"}.pdf`}
                        style={{ textDecoration: "none" }}
                        onClick={handlePdfDownloaded}
                      >
                        {({ loading }) => (
                          <Button
                            variant="contained"
                            color="success"
                            disabled={loading}
                            size="medium"
                            startIcon={
                              pdfDownloaded ? (
                                <CheckCircleIcon />
                              ) : (
                                <PictureAsPdfIcon />
                              )
                            }
                            sx={{
                              borderRadius: 2,
                              backgroundColor: pdfDownloaded
                                ? "#065f46"
                                : "#047857",
                              "&:hover": {
                                backgroundColor: "#065f46",
                              },
                            }}
                          >
                            {loading
                              ? "Preparing..."
                              : pdfDownloaded
                              ? "PDF Downloaded"
                              : "Download PDF"}
                          </Button>
                        )}
                      </PDFDownloadLink>

                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleDownloadDocx()}
                        disabled={downloadingDocx}
                        size="medium"
                        startIcon={
                          docxDownloaded ? (
                            <CheckCircleIcon />
                          ) : (
                            <DescriptionIcon />
                          )
                        }
                        sx={{
                          borderRadius: 2,
                          backgroundColor: docxDownloaded
                            ? "#1e40af"
                            : "#1e3a8a",
                          "&:hover": {
                            backgroundColor: "#1e40af",
                          },
                        }}
                      >
                        {downloadingDocx
                          ? "Preparing..."
                          : docxDownloaded
                          ? "DOCX Downloaded"
                          : "Download DOCX"}
                      </Button>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={1}
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      height: 600,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <BlobProvider document={<ResumePDF data={jsonData} />}>
                      {({ url, loading }) =>
                        loading ? (
                          <Box
                            height="100%"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            sx={{ backgroundColor: "#f8fafc" }}
                          >
                            <CircularProgress sx={{ color: "#1e3a8a" }} />
                          </Box>
                        ) : (
                          <iframe
                            src={url}
                            title="PDF Preview"
                            width="100%"
                            height="100%"
                            style={{ border: "none" }}
                          />
                        )
                      }
                    </BlobProvider>
                  </Paper>
                </>
              )}

              {/* Multiple Files List with Preview */}
              {uploadMode === "multiple" && multipleJsonData.length > 0 && (
                <Box>
                  {multipleJsonData.map((item, index) => (
                    <Accordion
                      key={index}
                      expanded={expandedPreviews.has(index)}
                      onChange={() => togglePreview(index)}
                      sx={{
                        mb: 2,
                        border: "1px solid #e2e8f0",
                        borderRadius: 2,
                        "&:before": {
                          display: "none",
                        },
                        "&.Mui-expanded": {
                          margin: "0 0 16px 0",
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px 8px 0 0",
                          "&.Mui-expanded": {
                            borderRadius: expandedPreviews.has(index)
                              ? "8px 8px 0 0"
                              : 2,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            mr: 2,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {getFileIcon(item.fileName)}
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {item.fileName}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Click to{" "}
                                {expandedPreviews.has(index)
                                  ? "hide"
                                  : "preview"}{" "}
                                resume
                              </Typography>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label="Processed"
                              color="success"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PreviewIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePreview(index);
                              }}
                            >
                              {expandedPreviews.has(index) ? "Hide" : "Preview"}
                            </Button>
                          </Box>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ p: 0 }}>
                        <Box sx={{ p: 2 }}>
                          {/* Download Buttons */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mb: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <PDFDownloadLink
                              document={<ResumePDF data={item.data} />}
                              fileName={`${
                                item.data.name ||
                                item.fileName.replace(/\.[^/.]+$/, "")
                              }.pdf`}
                              style={{ textDecoration: "none" }}
                            >
                              {({ loading }) => (
                                <Button
                                  variant="contained"
                                  color="success"
                                  disabled={loading}
                                  size="small"
                                  startIcon={<PictureAsPdfIcon />}
                                >
                                  {loading ? "Preparing..." : "Download PDF"}
                                </Button>
                              )}
                            </PDFDownloadLink>

                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() =>
                                handleDownloadDocx(item.data, item.fileName)
                              }
                              size="small"
                              startIcon={<DescriptionIcon />}
                            >
                              Download DOCX
                            </Button>
                          </Box>

                          {/* PDF Preview */}
                          <Paper
                            elevation={1}
                            sx={{
                              borderRadius: 2,
                              overflow: "hidden",
                              height: 500,
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <BlobProvider
                              document={<ResumePDF data={item.data} />}
                            >
                              {({ url, loading }) =>
                                loading ? (
                                  <Box
                                    height="100%"
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    sx={{ backgroundColor: "#f8fafc" }}
                                  >
                                    <CircularProgress
                                      sx={{ color: "#1e3a8a" }}
                                    />
                                  </Box>
                                ) : (
                                  <iframe
                                    src={url}
                                    title={`PDF Preview - ${item.fileName}`}
                                    width="100%"
                                    height="100%"
                                    style={{ border: "none" }}
                                  />
                                )
                              }
                            </BlobProvider>
                          </Paper>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {/* Show batch progress details if available */}
              {uploadMode === "multiple" &&
                batchProgress &&
                batchProgress.failed_files > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "#fef3c7",
                      border: "1px solid #f59e0b",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#92400e" }}>
                      <strong>Note:</strong> {batchProgress.failed_files}{" "}
                      file(s) failed to process. Only successfully processed
                      files are shown above.
                    </Typography>
                  </Paper>
                )}

              <Box mt={3} display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={() => setActiveTab(0)}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    borderRadius: 2,
                    borderColor: "#1e3a8a",
                    color: "#1e3a8a",
                    "&:hover": {
                      borderColor: "#1e40af",
                      backgroundColor: "#f1f5f9",
                    },
                  }}
                >
                  Upload More Files
                </Button>

                {error && (
                  <Typography
                    color="error"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "#fee2e2",
                    }}
                  >
                    {error}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "#1e3a8a",
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                Your Resume History
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setActiveTab(0)}
                startIcon={<ArrowBackIcon />}
                sx={{
                  borderRadius: 2,
                  borderColor: "#1e3a8a",
                  color: "#1e3a8a",
                  "&:hover": {
                    borderColor: "#1e40af",
                    backgroundColor: "#f1f5f9",
                  },
                }}
              >
                Upload resume
              </Button>

              <ResumeHistory onSelectResume={handleHistoryItemSelect} />
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={openSuccessAlert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
