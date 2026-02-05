import { useMemo, useState } from "react";
import { fetchSummary } from "./api";
import "./styles.css";

const DEFAULT_START = "2025-07-01";
const DEFAULT_END = "2025-07-03";

function formatPct(value) {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(4)}%`;
}

function formatRate(value) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(4);
}

export default function App() {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [breakdown, setBreakdown] = useState("day");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = await fetchSummary({ startDate, endDate, breakdown });
      setData(payload);
    } catch (err) {
      setError(err.message || "Unable to load data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const totals = data?.totals;
  const days = useMemo(() => data?.days || [], [data]);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">FX Dashboard</p>
          <h1>EUR → USD Snapshot</h1>
          <p className="subhead">
            Pull day-by-day rates from the Frankfurter API, with resilient fallback
            and cached responses.
          </p>
        </div>
        <div className="badge">
          <span className="label">Source</span>
          <span className="value">{data?.source || "—"}</span>
        </div>
      </header>

      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>
          <label>
            Breakdown
            <select
              value={breakdown}
              onChange={(event) => setBreakdown(event.target.value)}
            >
              <option value="day">Day</option>
              <option value="none">None</option>
            </select>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Loading…" : "Run summary"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {totals && (
          <div className="totals">
            <div>
              <span>Start rate</span>
              <strong>{formatRate(totals.start_rate)}</strong>
            </div>
            <div>
              <span>End rate</span>
              <strong>{formatRate(totals.end_rate)}</strong>
            </div>
            <div>
              <span>Total % change</span>
              <strong>{formatPct(totals.total_pct_change)}</strong>
            </div>
            <div>
              <span>Mean rate</span>
              <strong>{formatRate(totals.mean_rate)}</strong>
            </div>
          </div>
        )}

        {breakdown === "day" && days.length > 0 && (
          <div className="table">
            <div className="table-row table-head">
              <span>Date</span>
              <span>Rate</span>
              <span>% Change</span>
            </div>
            {days.map((day) => (
              <div className="table-row" key={day.date}>
                <span>{day.date}</span>
                <span>{formatRate(day.rate)}</span>
                <span>{formatPct(day.pct_change)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
