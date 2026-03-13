import React from 'react';
import { CssBaseline, ThemeProvider, createTheme, Box } from '@mui/material';
import LaptopForm from './components/LaptopForm';

const theme = createTheme({
  palette: { mode: 'light' },
  typography: { fontFamily: 'Inter, Roboto, Arial' }
});

export default function App(){
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f3f6f9', p:2 }}>
        <LaptopForm />
      </Box>
    </ThemeProvider>
  );
}