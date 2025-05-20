import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LoginIcon from "@mui/icons-material/Login";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { getToken, removeToken, getUsername } from "../utils/token";

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();
  const username = getUsername();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    removeToken();
    handleMenuClose();
    navigate("/login");
  };

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0].toUpperCase())
          .join("")
      : "?";

  return (
    <AppBar
      position="static"
      sx={{
        background: "linear-gradient(to right, #4a148c)",
        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          onClick={() => navigate("/")}
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            letterSpacing: "1px",
            cursor: "pointer",
            transition: "transform 0.2s ease-in-out",
            "&:hover": { transform: "scale(1.05)" },
          }}
        >
          Resume Extractor
        </Typography>

        <Box>
          {isLoggedIn ? (
            <>
              <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: "#ff7043" }}>
                  {getInitials(username)}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 150,
                    boxShadow: theme.shadows[5],
                  },
                }}
              >
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    "&:hover": { backgroundColor: "#fce4ec" },
                  }}
                >
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={() => navigate("/login")}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  mx: 1,
                  "&:hover": {
                    backgroundColor: "#fce4ec",
                    color: "#880e4f",
                  },
                }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                startIcon={<AppRegistrationIcon />}
                onClick={() => navigate("/register")}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#fce4ec",
                    color: "#880e4f",
                  },
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
