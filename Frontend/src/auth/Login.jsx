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
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { setToken } from "../utils/token";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // NEW: loading state

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("/auth/login", form);
      setToken(res.data.access_token);
      setSuccess("Login Successful");
      setTimeout(() => {
        navigate("/upload");
      }, 2000);
    } catch (err) {
      setError("Invalid username or password", err);
    } finally {
      setLoading(false); // Always stop loading after response
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Card elevation={4} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={3}>
            <Typography variant="h4" align="center" fontWeight="bold">
              Login
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
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              variant="outlined"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              size="large"
              disabled={loading}
              sx={{
                background: "linear-gradient(to right, #4a148c, #7b1fa2)",
                boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                borderRadius: 2,
                "&:hover": {
                  background: "linear-gradient(to right, #6a1b9a, #9c27b0)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Login"
              )}
            </Button>
            <Typography align="center" fontSize={14}>
              Don’t have an account?{" "}
              <Button onClick={() => navigate("/register")} size="small">
                Register
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
