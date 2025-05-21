import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  CircularProgress, // Added for spinner
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // New state for loading

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true); // Start loading
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success message
    try {
      await axios.post("/auth/register", form);
      setSuccess("Registration successful! You can now log in.");
      setTimeout(() => {
        setLoading(false); // Stop loading before navigation
        navigate("/login");
      }, 1500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      setSuccess("");
      setLoading(false); // Stop loading on error
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={3}>
            <Typography variant="h4" align="center" fontWeight="bold">
              Register
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <TextField
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              disabled={loading} // Disable input during loading
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              disabled={loading} // Disable input during loading
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              size="large"
              disabled={loading} // Disable button during loading
              sx={{
                background: "linear-gradient(to right, #4a148c, #7b1fa2)",
                boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                borderRadius: 2,
                "&:hover": {
                  background: "linear-gradient(to right, #6a1b9a, #9c27b0)",
                },
                "&.Mui-disabled": {
                  background: "linear-gradient(to right, #4a148c, #7b1fa2)",
                  opacity: 0.6,
                  color: "#fff",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Register"
              )}
            </Button>
            <Typography align="center" fontSize={14}>
              Already have an account?{" "}
              <Button
                onClick={() => navigate("/login")}
                size="small"
                disabled={loading} // Disable navigation during loading
              >
                Login
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
