import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import { PDFDownloadLink, BlobProvider } from "@react-pdf/renderer";
import ResumePDF from "./ResumePreview";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDataReady, setIsDataReady] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (file) {
      setJsonData(null);
      setError(null);
      setIsDataReady(false);
    }
  }, [file]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setJsonData(null);
    setIsDataReady(false);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/resume/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: form,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await res.json();
      setJsonData(data);
      setIsDataReady(true);
    } catch (err) {
      setError(err.message || "An error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    onDrop: (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        setError("Please upload a PDF, DOC, or DOCX file.");
        setFile(null);
        return;
      }
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setError(null);
      } else {
        setFile(null);
        setError(null);
      }
    },
    multiple: false,
  });

  const getFileIcon = () => {
    if (!file) {
      return <UploadFileIcon sx={{ fontSize: 40, color: "text.secondary" }} />;
    }
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension === "pdf") {
      return <PictureAsPdfIcon sx={{ fontSize: 40, color: "error.main" }} />;
    }
    if (fileExtension === "doc" || fileExtension === "docx") {
      return <DescriptionIcon sx={{ fontSize: 40, color: "primary.main" }} />;
    }
    return <UploadFileIcon sx={{ fontSize: 40, color: "text.secondary" }} />;
  };

  const dropzoneStyle = {
    border: "2px dashed #e0e0e0",
    borderRadius: "12px",
    padding: "30px",
    textAlign: "center",
    cursor: "pointer",
    background: file
      ? "#fff"
      : "linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%)",
    borderColor: isDragAccept
      ? "#4caf50"
      : isDragReject
      ? "#f44336"
      : "#e0e0e0",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    width: "100%",
    minHeight: "150px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="start"
      mt={2}
      minHeight="90vh"
      bgcolor="white"
    >
      <Card sx={{ width: "90%", maxWidth: 1000, p: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" gutterBottom>
            Upload Resume
          </Typography>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <Box {...getRootProps()} sx={dropzoneStyle}>
              <input {...getInputProps()} />
              {getFileIcon()}
              {isDragActive ? (
                <Typography
                  variant="body1"
                  color={isDragAccept ? "success.main" : "error.main"}
                  sx={{ mt: 1 }}
                >
                  {isDragAccept ? "Drop the file here!" : "Invalid file type!"}
                </Typography>
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {file
                    ? file.name
                    : "Drag and drop a PDF, DOC, or DOCX file here, or click to select"}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>

            {loading && <CircularProgress size={24} sx={{ mt: 1 }} />}
          </Box>

          {error && (
            <Typography variant="body1" color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {isDataReady && jsonData && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }}>
                <Typography variant="h6">Resume Preview</Typography>
              </Divider>

              <Box
                display="flex"
                flexDirection={{ xs: "column", md: "row" }}
                gap={3}
              >
                <Box
                  flex={1}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <BlobProvider document={<ResumePDF data={jsonData} />}>
                    {({ url, loading, error }) => {
                      if (loading)
                        return (
                          <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="500px"
                          >
                            <CircularProgress />
                          </Box>
                        );

                      if (error)
                        return (
                          <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            height="500px"
                          >
                            <Typography color="error">
                              Failed to generate preview
                            </Typography>
                          </Box>
                        );

                      if (!url) return null;

                      return (
                        <iframe
                          src={`${url}#view=FitH`}
                          title="Resume PDF Preview"
                          width="100%"
                          height="600px"
                          style={{ border: "none" }}
                        />
                      );
                    }}
                  </BlobProvider>
                </Box>

                <Box
                  flex={0.4}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ p: 2 }}
                >
                  <Typography
                    variant="body1"
                    color="success.main"
                    textAlign="center"
                    gutterBottom
                  >
                    Resume processed successfully!
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mb: 3 }}
                  >
                    Your resume has been formatted and is ready for download.
                  </Typography>

                  <PDFDownloadLink
                    document={<ResumePDF data={jsonData} />}
                    fileName={`${jsonData.name || "resume"}.pdf`}
                    style={{ textDecoration: "none", width: "100%" }}
                  >
                    {({ loading }) => (
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled={loading}
                        sx={{ py: 1.5 }}
                      >
                        {loading ? "Preparing PDF..." : "Download Resume PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Upload;
