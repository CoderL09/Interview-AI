import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

interface Question {
  id: number;
  title: string;
  answer: string;
  tags: string;
}

export function useQuestions() {
  const navigate = useNavigate();
  const [result, setResult] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [selectTag, setSelectTag] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit };
        if (selectTag) params.tags = selectTag;
        const res = await axios.get(`${API_BASE}/questions`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        if (res.data.success) {
          setResult(res.data.data);
          setTotalPages(res.data.pagination.totalPages);
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, limit, selectTag, navigate]);

  return { result, loading, page, limit, totalPages, selectTag, setPage, setLimit, setSelectTag };
}
