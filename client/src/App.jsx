import { useEffect, useMemo, useState } from "react";
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildSparkline(days, width = 640, height = 220, padding = 24) {
  if (!days || days.length === 0) return "";
  const rates = days.map((day) => day.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 1;
  const step = (width - padding * 2) / (days.length - 1 || 1);
  return days
    .map((day, index) => {
      const x = padding + index * step;
      const y =
        height -
        padding -
        ((day.rate - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function App() {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [breakdown, setBreakdown] = useState("day");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [liveRate, setLiveRate] = useState(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState("");
  const [liveError, setLiveError] = useState("");
  const [hoverIndex, setHoverIndex] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = await fetchSummary({ startDate, endDate, breakdown });
      setData(payload);
      setPage(1);
    } catch (err) {
      setError(err.message || "Unable to load data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const totals = data?.totals;
  const days = useMemo(() => data?.days || [], [data]);
  const chartPoints = useMemo(() => buildSparkline(days), [days]);
  const chartData = useMemo(() => {
    const width = 640;
    const height = 220;
    const padding = 24;
    if (!days || days.length === 0) {
      return { width, height, padding, points: [] };
    }
    const rates = days.map((day) => day.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const range = max - min || 1;
    const step = (width - padding * 2) / (days.length - 1 || 1);
    const points = days.map((day, index) => {
      const x = padding + index * step;
      const y =
        height -
        padding -
        ((day.rate - min) / range) * (height - padding * 2);
      return { x, y, day };
    });
    return { width, height, padding, points };
  }, [days]);
  const totalPages = Math.max(1, Math.ceil(days.length / pageSize));
  const pagedDays = useMemo(() => {
    const start = (page - 1) * pageSize;
    return days.slice(start, start + pageSize);
  }, [days, page]);

  const refreshLiveRate = async () => {
    const today = todayISO();
    try {
      const payload = await fetchSummary({
        startDate: today,
        endDate: today,
        breakdown: "none"
      });
      setLiveRate(payload?.totals?.end_rate ?? null);
      setLiveUpdatedAt(new Date().toLocaleTimeString());
      setLiveError("");
    } catch (err) {
      setLiveError("Live rate unavailable");
    }
  };

  useEffect(() => {
    refreshLiveRate();
  }, []);

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
        <div className="meta">
          <div className="badge">
            <span className="label">Source</span>
            <span className="value">{data?.source || "—"}</span>
          </div>
          <div className="badge badge-light">
            <span className="label">Cache</span>
            <span className="value">
              {data?.source === "cache" ? "HIT" : data?.source ? "MISS" : "—"}
            </span>
          </div>
          <div className="badge badge-light">
            <div className="badge-row">
              <span className="label">Live rate</span>
              <button
                type="button"
                className="icon-button"
                onClick={refreshLiveRate}
                aria-label="Refresh live rate"
              >
                ↻
              </button>
            </div>
            <span className="value">
              {liveError ? liveError : formatRate(liveRate)}
            </span>
            <span className="timestamp">{liveUpdatedAt || "—"}</span>
          </div>
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
          <div className="chart-block">
            <div className="chart-header">
              <div>
                <h2>Change over time</h2>
                <p>Rates mapped across the selected date range.</p>
              </div>
              <div className="chart-stats">
                <span>Min: {formatRate(Math.min(...days.map((d) => d.rate)))}</span>
                <span>Max: {formatRate(Math.max(...days.map((d) => d.rate)))}</span>
              </div>
            </div>
            <svg className="chart" viewBox="0 0 640 220" aria-hidden="true">
              <polyline points={chartPoints} />
              {chartData.points.map((point, index) => (
                <circle
                  key={point.day.date}
                  cx={point.x}
                  cy={point.y}
                  r={hoverIndex === index ? 5 : 3}
                  className={hoverIndex === index ? "dot active" : "dot"}
                />
              ))}
            </svg>
            <div className="chart-overlay">
              {chartData.points.map((point, index) => (
                <button
                  key={point.day.date}
                  type="button"
                  className="chart-hit"
                  style={{ left: `${(point.x / chartData.width) * 100}%` }}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(index)}
                  onBlur={() => setHoverIndex(null)}
                  aria-label={`Rate on ${point.day.date}`}
                />
              ))}
            </div>
            {hoverIndex !== null && chartData.points[hoverIndex] && (
              <div
                className="chart-tooltip"
                style={{
                  left: `${(chartData.points[hoverIndex].x / chartData.width) * 100}%`
                }}
              >
                <span>{chartData.points[hoverIndex].day.date}</span>
                <strong>{formatRate(chartData.points[hoverIndex].day.rate)}</strong>
              </div>
            )}

            <div className="table">
              <div className="table-row table-head">
                <span>Date</span>
                <span>Rate</span>
                <span>% Change</span>
              </div>
              {pagedDays.map((day) => (
                <div className="table-row" key={day.date}>
                  <span>{day.date}</span>
                  <span>{formatRate(day.rate)}</span>
                  <span>{formatPct(day.pct_change)}</span>
                </div>
              ))}
            </div>
            <div className="pagination">
              <button
                type="button"
                className="pager"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="pager"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
