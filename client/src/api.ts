import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Item {
  id: number;
  text: string;
  isSelected: boolean;
}

interface FetchItemsResponse {
  items: Item[];
  total: number;
}

export const fetchItems = async (offset = 0, limit = 20, search = ''): Promise<FetchItemsResponse> => {
  const response = await api.get('/items', {
    params: { offset, limit, search },
  });
  return response.data;
};

export interface AppState {
    items: Item[];
    total: number;
    selectedIds: number[];
}

export const fetchState = async (): Promise<AppState> => {
    const response = await api.get('/state');
    return response.data;
};

export const updateState = async (data: { sorted?: number[]; selected?: number[] }) => {
    await api.post('/state', data);
}; 