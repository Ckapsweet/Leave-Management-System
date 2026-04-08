import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box sx={{ py: 3, textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">
        © {new Date().getFullYear()} CKAP Management System. All rights reserved.
      </Typography>
    </Box>
  );
}
