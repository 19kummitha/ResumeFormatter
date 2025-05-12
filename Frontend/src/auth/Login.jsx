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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { setToken } from "../utils/token";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post("/auth/login", form);
      setToken(res.data.access_token);
      navigate("/");
    } catch (err) {
      setError("Invalid username or password", err);
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
              sx={{ borderRadius: 2 }}
            >
              Login
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
