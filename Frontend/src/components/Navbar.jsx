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
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate } from "react-router-dom";
import { getToken, removeToken, getUsername } from "../utils/token";

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();
  const username = getUsername();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    removeToken();
    handleMenuClose();
    navigate("/login");
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#2c2c2c" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          onClick={() => navigate("/")}
          sx={{ cursor: "pointer" }}
        >
          Resume Extractor
        </Typography>
        <Box>
          {isLoggedIn ? (
            <>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                <AccountCircleIcon />
                <Typography
                  disableRipple
                  sx={{
                    "&:hover": {
                      backgroundColor: "inherit", // no background change
                    },
                    "&.Mui-focusVisible": {
                      backgroundColor: "inherit",
                    },
                  }}
                >
                  {username}
                </Typography>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                MenuListProps={{
                  disablePadding: true,
                }}
              >
                <MenuItem
                  onClick={handleLogout}
                  disableRipple // disables ripple
                  sx={{
                    "&:hover": {
                      backgroundColor: "inherit", // no background change
                    },
                    "&.Mui-focusVisible": {
                      backgroundColor: "inherit",
                    },
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
