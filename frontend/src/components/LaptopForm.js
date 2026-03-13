import React, { useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Container, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { predictLaptop } from '../services/api';

const COMPANIES = ['Dell','HP','Lenovo','Asus','Acer','Apple','MSI','Toshiba','Samsung','LG'];
const TYPES = ['Notebook','Ultrabook','Gaming','2 in 1 Convertible','Workstation','Netbook'];
const INCHES = ['13','14','15.6','17.3'];
const RESOLUTIONS = ['1366x768','1600x900','1920x1080','2560x1440','3840x2160'];
const CPUS = ['Intel Core i3','Intel Core i5','Intel Core i7','Intel Core i9','AMD Ryzen 5','AMD Ryzen 7'];
const RAMS = ['4GB','8GB','16GB','32GB'];
const MEMORIES = ['128GB SSD','256GB SSD','512GB SSD','1TB HDD','1TB SSD'];
const GPUS = ['Intel HD Graphics','Intel UHD Graphics','Nvidia GTX 1050','Nvidia GTX 1650','Nvidia RTX 3050','AMD Radeon'];
const OPS = ['Windows 10','Windows 11','Mac OS','Linux','No OS'];

export default function LaptopForm(){
    const [formData, setFormData] = useState({
        Company: '', TypeName: '', Inches: '', ScreenResolution: '', Cpu: '', Ram: '', Memory: '', Gpu: '', OpSys: '', Weight: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (key) => (ev) => setFormData(prev => ({...prev, [key]: ev.target.value}));

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setLoading(true); setError(null); setResult(null);
        try{
            const res = await predictLaptop(formData);
            setResult(res.prediction);
        }catch(err){
            setError(err?.message || 'Prediction failed');
        }finally{ setLoading(false); }
    };

    return (
        <Container maxWidth="sm" sx={{py:6}}>
            <Card elevation={8}>
                <CardContent>
                    <Stack spacing={2} alignItems="stretch">
                        <Typography variant="h5" textAlign="center">Laptop Price Predictor</Typography>

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2} sx={{mt:2}}>
                                <FormControl fullWidth>
                                    <InputLabel>Company</InputLabel>
                                    <Select value={formData.Company} label="Company" onChange={handleChange('Company')} required>
                                        {COMPANIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select value={formData.TypeName} label="Type" onChange={handleChange('TypeName')} required>
                                        {TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Screen Size</InputLabel>
                                        <Select value={formData.Inches} label="Screen Size" onChange={handleChange('Inches')}>
                                            {INCHES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel>Resolution</InputLabel>
                                        <Select value={formData.ScreenResolution} label="Resolution" onChange={handleChange('ScreenResolution')}>
                                            {RESOLUTIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <FormControl fullWidth>
                                    <InputLabel>CPU</InputLabel>
                                    <Select value={formData.Cpu} label="CPU" onChange={handleChange('Cpu')}>
                                        {CPUS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>RAM</InputLabel>
                                        <Select value={formData.Ram} label="RAM" onChange={handleChange('Ram')}>
                                            {RAMS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel>Storage</InputLabel>
                                        <Select value={formData.Memory} label="Storage" onChange={handleChange('Memory')}>
                                            {MEMORIES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <FormControl fullWidth>
                                    <InputLabel>GPU</InputLabel>
                                    <Select value={formData.Gpu} label="GPU" onChange={handleChange('Gpu')}>
                                        {GPUS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>OS</InputLabel>
                                        <Select value={formData.OpSys} label="OS" onChange={handleChange('OpSys')}>
                                            {OPS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel>Weight (kg)</InputLabel>
                                        <Select value={formData.Weight} label="Weight (kg)" onChange={handleChange('Weight')}>
                                            {['0.9','1.2','1.5','1.8','2.0','2.5','3.0'].map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <Box sx={{display:'flex', justifyContent:'center', mt:1}}>
                                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                                        {loading ? <CircularProgress size={20} color="inherit" /> : 'Predict Price'}
                                    </Button>
                                </Box>
                            </Stack>
                        </form>

                        {error && <Typography color="error">{error}</Typography>}

                        {result !== null && (
                            <Card variant="outlined" sx={{mt:2}}>
                                <CardContent>
                                    <Typography variant="subtitle2" color="text.secondary">Predicted Price</Typography>
                                    <Typography variant="h4">₹ {Number(result).toLocaleString()}</Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
}