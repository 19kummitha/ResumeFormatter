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
  Divider,
} from "@mui/material";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDownloadLink, BlobProvider } from "@react-pdf/renderer";
import ResumePDF from "./ResumePreview";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";

const steps = ["Upload", "Preview", "Download"];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const token = localStorage.getItem("token");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/resume/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token || ""}` },
        body: form,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await res.json();
      setJsonData(data);
      setActiveStep(1); // Move to Preview step
    } catch (err) {
      setError(err.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setError(null);
      }
    },
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
    <Box p={3}>
      <Card sx={{ maxWidth: 1000, margin: "auto", p: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Resume Processor
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box
              sx={{
                border: "2px dashed #ccc",
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: "#fafafa",
                cursor: "pointer",
              }}
            >
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                {getFileIcon()}
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {isDragActive
                    ? "Drop your file..."
                    : file
                    ? file.name
                    : "Drag & drop or click to select a file"}
                </Typography>
              </div>

              <Box
                mt={3}
                display="flex"
                gap={2}
                justifyContent="center"
                flexWrap="wrap"
              >
                <Button
                  variant="outlined"
                  onClick={() =>
                    document.querySelector('input[type="file"]').click()
                  }
                >
                  Choose File
                </Button>

                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!file || loading}
                >
                  {loading ? "Uploading..." : "Upload"}
                </Button>
              </Box>

              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
            </Box>
          )}

          {activeStep === 1 && jsonData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Preview Your Resume
              </Typography>

              <Box
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  overflow: "hidden",
                  height: 600,
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
                      >
                        <CircularProgress />
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
              </Box>

              <Button
                variant="contained"
                sx={{ mt: 3 }}
                onClick={() => setActiveStep(2)}
              >
                Continue to Download
              </Button>
            </Box>
          )}

          {activeStep === 2 && jsonData && (
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                Ready to Download
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Your resume has been processed and is ready for download.
              </Typography>
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
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {loading ? "Preparing..." : "Download Resume PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
