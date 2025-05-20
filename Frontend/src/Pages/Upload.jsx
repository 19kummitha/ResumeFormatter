"use client";

import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Paper,
} from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDownloadLink, BlobProvider } from "@react-pdf/renderer";
import ResumePDF from "./ResumePreview";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { generateResumeDocx } from "./DocxGenerator";

// Reduced to just two steps
const steps = ["Upload", "Preview & Download"];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const token = localStorage.getItem("token");

  // Reset loading states when component unmounts or when activeStep changes
  useEffect(() => {
    return () => {
      setLoading(false);
      setUploading(false);
      setProcessing(false);
    };
  }, [activeStep]);

  const handleUpload = async () => {
    if (!file) return;

    // Reset all states
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    setUploading(true);
    setProcessing(false);

    const form = new FormData();
    form.append("file", file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", async () => {
        setUploading(false);

        if (xhr.status >= 200 && xhr.status < 300) {
          setProcessing(true);
          const data = JSON.parse(xhr.responseText);
          setJsonData(data);

          // Simulate processing with a more realistic approach
          setUploadProgress(80); // Set to 80% after upload
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate processing time
          setUploadProgress(100); // Finally set to 100%
          setProcessing(false);
          setActiveStep(1);
          setLoading(false);
        } else {
          // Handle error response
          setError("Upload failed");
          setLoading(false);
        }
      });

      xhr.addEventListener("error", () => {
        setError("Network error occurred");
        setUploading(false);
        setProcessing(false);
        setLoading(false);
      });

      xhr.open("POST", "http://localhost:8000/resume/upload");
      xhr.setRequestHeader("Authorization", `Bearer ${token || ""}`);
      xhr.send(form);
    } catch (err) {
      setError(err.message || "Upload error");
      setUploading(false);
      setProcessing(false);
      setLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!jsonData) return;

    setDownloadingDocx(true);
    try {
      await generateResumeDocx(jsonData);
    } catch (err) {
      setError(err.message || "DOCX download error");
      console.error(err);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    onDrop,
    multiple: false,
  });

  const getFileIcon = () => {
    if (!file) return <UploadFileIcon fontSize="large" />;
    const ext = file.name.split(".").pop();
    if (ext === "pdf")
      return <PictureAsPdfIcon color="error" fontSize="large" />;
    if (["doc", "docx"].includes(ext))
      return <DescriptionIcon color="primary" fontSize="large" />;
    return <UploadFileIcon fontSize="large" />;
  };

  return (
    <Box p={3} sx={{ backgroundColor: "#f1f5f9" }}>
      <Card
        sx={{
          maxWidth: 800,
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
              color: "#1e3a8a",
              fontWeight: 600,
              mb: 3,
            }}
          >
            Resume Formatter
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 4,
              backgroundColor: "#f8fafc",
              borderRadius: 2,
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {activeStep === 0 && (
            <Box>
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
                  fontSize="large"
                  sx={{ color: "#1e3a8a", fontSize: 48, mb: 1 }}
                />
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                  {isDragActive
                    ? "Drop your file here..."
                    : file
                    ? `Selected: ${file.name}`
                    : "Drag & drop your resume file here or click to browse"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Supported formats: PDF, DOC, DOCX
                </Typography>
              </Box>

              {file && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    backgroundColor: "#f8fafc",
                  }}
                >
                  {getFileIcon()}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" noWrap fontWeight={500}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Paper>
              )}

              {uploading && (
                <Box sx={{ width: "100%", mb: 2 }}>
                  <Typography
                    variant="body2"
                    align="center"
                    gutterBottom
                    fontWeight={500}
                  >
                    Uploading: {uploadProgress}%
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
                </Box>
              )}

              {processing && (
                <Box sx={{ width: "100%", mb: 2 }}>
                  <Typography
                    variant="body2"
                    align="center"
                    gutterBottom
                    fontWeight={500}
                  >
                    Processing file...
                  </Typography>
                  <LinearProgress
                    variant="indeterminate"
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#e2e8f0",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#1e3a8a",
                      },
                    }}
                  />
                </Box>
              )}

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
                  disabled={!file || loading}
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
                  {loading ? "Processing..." : "Upload Resume"}
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

          {activeStep === 1 && jsonData && (
            <Box>
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
                  >
                    {({ loading }) => (
                      <Button
                        variant="contained"
                        color="success"
                        disabled={loading}
                        size="medium"
                        startIcon={<PictureAsPdfIcon />}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: "#047857",
                          "&:hover": {
                            backgroundColor: "#065f46",
                          },
                        }}
                      >
                        {loading ? "Preparing..." : "Download PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDownloadDocx}
                    disabled={downloadingDocx}
                    size="medium"
                    startIcon={<DescriptionIcon />}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#1e3a8a",
                      "&:hover": {
                        backgroundColor: "#1e40af",
                      },
                    }}
                  >
                    {downloadingDocx ? "Preparing..." : "Download DOCX"}
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

              <Box mt={3} display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setActiveStep(0);
                    setUploadProgress(0);
                    setUploading(false);
                    setProcessing(false);
                  }}
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
                  Upload Another File
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
        </CardContent>
      </Card>
    </Box>
  );
}
