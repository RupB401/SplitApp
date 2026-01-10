import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import configData from "../../config.json";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const userData = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      // Handle error
      navigate("/login", {
        state: { error: "Google login failed. Please try again." },
      });
      return;
    }

    if (token && userData) {
      try {
        // Parse user data
        const user = JSON.parse(decodeURIComponent(userData));

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("profile", JSON.stringify(user));

        // Redirect to dashboard
        window.location.href = configData.DASHBOARD_URL;
      } catch (err) {
        console.error("Error parsing user data:", err);
        navigate("/login", {
          state: { error: "Authentication failed. Please try again." },
        });
      }
    } else {
      navigate("/login", {
        state: { error: "Authentication failed. Please try again." },
      });
    }
  }, [searchParams, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <CircularProgress size={60} />
      <Typography variant="h6" mt={3}>
        Completing Google Sign In...
      </Typography>
    </Box>
  );
}
