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
import { Document, Packer, Paragraph, TextRun, SectionType } from "docx";
import { saveAs } from "file-saver";

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

  // Function to generate DOCX file (simplified)
  const generateDocx = (jsonData) => {
    const projects =
      Array.isArray(jsonData?.projects) &&
      !jsonData.projects.includes("Not available")
        ? jsonData.projects
        : [];
    const experiences = Array.isArray(jsonData?.professional_experience)
      ? jsonData.professional_experience
      : [];
    const education =
      Array.isArray(jsonData?.education) &&
      !jsonData.education.includes("Not available")
        ? jsonData.education
        : [];
    const skills = Array.isArray(jsonData?.skills) ? jsonData.skills : [];
    const certifications =
      Array.isArray(jsonData?.certifications) &&
      !jsonData.certifications.includes("Not available")
        ? jsonData.certifications
        : [];
    const summary =
      jsonData?.summary && jsonData.summary !== "Not available"
        ? jsonData.summary
        : "";
    const experienceData = Array.isArray(jsonData?.experience_data)
      ? jsonData.experience_data
      : [];

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 }, // 1 inch = 720 points
            },
          },
          children: [
            // Header (Name) - Removed background color
            new Paragraph({
              children: [
                new TextRun({
                  text: jsonData.name || "Resume",
                  bold: true,
                  size: 48, // 24pt
                }),
              ],
              spacing: { after: 200 },
            }),
            // Education Section
            new Paragraph({
              children: [
                new TextRun({
                  text: "Education",
                  bold: true,
                  size: 32, // 16pt
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            ...education.map(
              (edu) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${edu}`,
                      size: 22, // 11pt
                    }),
                  ],
                  spacing: { after: 50 },
                })
            ),
            // Technical Expertise Section
            new Paragraph({
              children: [
                new TextRun({
                  text: "Technical Expertise",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            ...skills.map((group) => {
              const [category, skillList] = Object.entries(group)[0];
              return new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${category}: ${skillList.join(", ")}`,
                    size: 22,
                  }),
                ],
                spacing: { after: 50 },
              });
            }),
            // Certifications Section
            ...(certifications.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Certifications",
                        bold: true,
                        size: 32,
                      }),
                    ],
                    spacing: { before: 200, after: 100 },
                  }),
                  ...certifications.map(
                    (cert) =>
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `• ${cert}`,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 50 },
                      })
                  ),
                ]
              : []),
            // Summary Section
            ...(summary
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Summary",
                        bold: true,
                        size: 32,
                      }),
                    ],
                    spacing: { before: 200, after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${summary}`,
                        size: 22,
                      }),
                    ],
                    spacing: { after: 50 },
                  }),
                ]
              : []),
            // Professional Experience Section
            new Paragraph({
              children: [
                new TextRun({
                  text: "Professional Experience",
                  bold: true,
                  size: 36, // 18pt
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
            ...experiences.map(
              (exp) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${exp}`,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 50 },
                })
            ),
            // Projects Section
            ...(projects.length > 0
              ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Projects",
                        bold: true,
                        size: 36,
                      }),
                    ],
                    spacing: { before: 200, after: 100 },
                  }),
                  ...projects.map(
                    (project) =>
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `• ${project}`,
                            size: 22,
                          }),
                        ],
                        spacing: { after: 50 },
                      })
                  ),
                ]
              : []),
          ],
        },
        // Professional Experience Page (Detailed)
        {
          properties: {
            type: SectionType.NEXT_PAGE, // Start on a new page
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Professional Experience",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...experienceData.flatMap((exp) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Company: ${exp.company}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date: ${exp.startDate} to ${exp.endDate}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Role: ${exp.role}`,
                    size: 24,
                  }),
                ],
                spacing: { after: 50 },
              }),
              ...(exp.clientEngagement &&
              exp.clientEngagement !== "Not available"
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Client Engagement: ${exp.clientEngagement}`,
                          size: 24,
                        }),
                      ],
                      spacing: { after: 50 },
                    }),
                  ]
                : []),
              ...(exp.program && exp.program !== "Not available"
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Program: ${exp.program}`,
                          size: 24,
                        }),
                      ],
                      spacing: { after: 50 },
                    }),
                  ]
                : []),
              ...(Array.isArray(exp.responsibilities) &&
              exp.responsibilities.length > 0
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Responsibilities:",
                          bold: true,
                          size: 24,
                        }),
                      ],
                      spacing: { after: 50 },
                    }),
                    ...exp.responsibilities.map(
                      (resp) =>
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `  • ${resp}`,
                              size: 24,
                            }),
                          ],
                          spacing: { after: 50 },
                        })
                    ),
                  ]
                : []),
            ]),
          ],
        },
      ],
    });

    return doc;
  };

  // Function to download DOCX file with error handling
  const downloadDocx = async (jsonData) => {
    try {
      const doc = generateDocx(jsonData);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${jsonData.name || "resume"}.docx`);
    } catch (err) {
      console.error("Error generating or downloading DOCX:", err);
      setError("Failed to generate DOCX file. Please try again.");
    }
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
                Your resume has been processed and is ready for download. Choose
                your preferred format:
              </Typography>
              <Box display="flex" gap={2} justifyContent="center">
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
                      {loading ? "Preparing PDF..." : "Download as PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => downloadDocx(jsonData)}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Download as DOCX
                </Button>
              </Box>
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
