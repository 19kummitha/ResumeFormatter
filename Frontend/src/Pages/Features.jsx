import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sample features array (customize as needed)
const features = [
  {
    icon: <CloudUploadIcon sx={{ fontSize: 48, color: "#1e3a8a" }} />,
    title: "Easy Upload",
    desc: "Drag and drop your resume in PDF, DOC, or DOCX format for quick processing.",
  },
  {
    icon: <VisibilityIcon sx={{ fontSize: 48, color: "#047857" }} />,
    title: "Instant Preview",
    desc: "View your parsed resume instantly with a clean, professional layout.",
  },
  {
    icon: <DownloadIcon sx={{ fontSize: 48, color: "#b91c1c" }} />,
    title: "Flexible Downloads",
    desc: "Download your resume as a PDF or DOCX file with one click.",
  },
];

// Animation variants for cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.2, duration: 0.5 },
  }),
  hover: {
    scale: 1.05,
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
    transition: { duration: 0.3 },
  },
};

export default function FeaturesSection() {
  return (
    <Box sx={{ py: 8, bgcolor: "#f1f5f9" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "#1e3a8a",
            mb: 4,
            letterSpacing: "0.5px",
          }}
        >
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                custom={index}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={cardVariants}
              >
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    bgcolor: "#ffffff",
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: "#f8fafc",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardActionArea
                    sx={{
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                    disableRipple
                  >
                    <Box
                      mb={2}
                      sx={{
                        p: 2,
                        borderRadius: "50%",
                        bgcolor: "#e0e7ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <CardContent sx={{ textAlign: "center", p: 0 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          color: "#1e3a8a",
                          fontSize: "1.25rem",
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: "0.95rem",
                          lineHeight: 1.6,
                          color: "#475569",
                        }}
                      >
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
