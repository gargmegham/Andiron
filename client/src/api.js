const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function fetchSummary({ startDate, endDate, breakdown }) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    breakdown
  });
  const response = await fetch(`${API_BASE}/summary?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json();
}
