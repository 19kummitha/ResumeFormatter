import React from "react";
import { Typography, Button, Container, Box, Grid, Paper } from "@mui/material";
import FeaturesSection from "./Features";
export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Box sx={{ backgroundColor: "#f5f5f5", py: 10, textAlign: "center" }}>
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom>
            Reformat Your Resume for Any Job
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Upload, parse, reformat, and export your resume tailored to company
            requirements.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ mr: 2 }}
              href="/login"
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <FeaturesSection />
      </Box>
    </>
  );
}
