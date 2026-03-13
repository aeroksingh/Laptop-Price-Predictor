import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export async function predictLaptop(payload){
  const res = await client.post('/api/predict/', payload);
  return res.data;
}

export default client;
