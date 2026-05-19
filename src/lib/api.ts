import axios from 'axios';

// URL do seu backend FastAPI. 
// Você pode mudar isso para o IP real se estiver rodando em outra máquina.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tipos básicos para compatibilidade
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
