import { useState, useEffect } from "react";

interface ModelStatus {
  llm: string | null;
  embedding: string | null;
}

export function useModelStatus(apiUrl: string) {
  const [status, setStatus] = useState<ModelStatus>({ llm: null, embedding: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const readLoadedModel = async (domain: "llm" | "embedding"): Promise<string | null> => {
    const response = await fetch(`${apiUrl}/v1/models/loaded?domain=${domain}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${domain} model status`);
    }

    const payload = await response.json();
    const loaded = Array.isArray(payload?.data) ? payload.data : [];
    const first = loaded[0];
    if (typeof first === "string") {
      return first;
    }
    if (first && typeof first === "object") {
      const key = (first as Record<string, unknown>).identifier;
      return typeof key === "string" && key.trim() ? key : null;
    }
    return null;
  };

  const fetchStatus = async () => {
    try {
      const [llm, embedding] = await Promise.all([readLoadedModel("llm"), readLoadedModel("embedding")]);
      setStatus({
        llm,
        embedding,
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
