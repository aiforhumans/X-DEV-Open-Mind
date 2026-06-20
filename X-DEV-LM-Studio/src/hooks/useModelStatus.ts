import { useState, useEffect } from "react";

interface ModelStatus {
  llm: string | null;
  embedding: string | null;
}

export function useModelStatus(apiUrl: string) {
  const [status, setStatus] = useState<ModelStatus>({ llm: null, embedding: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/v1/models/loaded`);
      if (!response.ok) throw new Error("Failed to fetch model status");
      
      const data = await response.json();
      setStatus({
        llm: Array.isArray(data.llm) && data.llm.length > 0 ? data.llm[0] : null,
        embedding: Array.isArray(data.embedding) && data.embedding.length > 0 ? data.embedding[0] : null,
      });
      setError(null);
    } catch (err) {
      setError(err as Error);
      setStatus({ llm: null, embedding: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return { status, loading, error, refetch: fetchStatus };
}
