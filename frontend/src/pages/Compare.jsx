import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const RISK_STYLES = {
  normal: "bg-green-100 text-green-800",
  low: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800"
};

const DIR_ICONS = {
  improved: <span className="text-green-600 font-bold" title="Improved">🟢 Improved</span>,
  worsened: <span className="text-red-600 font-bold" title="Worsened">🔴 Worsened</span>,
  stable: <span className="text-slate-500 font-bold" title="Stable">⚪ Stable</span>,
  new_in_b: <span className="text-blue-500 font-bold">New</span>,
  not_tested: <span className="text-slate-400 italic">Not tested</span>
};

export default function Compare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportA = searchParams.get('report_a');
  const reportB = searchParams.get('report_b');
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportA || !reportB) {
      navigate('/history');
      return;
    }
    fetchComparison();
  }, [reportA, reportB]);

  const fetchComparison = async () => {
    try {
      const res = await api.get(`/trends/reports/compare?report_a=${reportA}&report_b=${reportB}`);
      setData(res.data);
    } catch (err) {
      console.error("Comparison failed", err);
      alert("Could not load comparison. Ensure both reports exist.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading comparison...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Compare Reports</h1>
        <button onClick={() => navigate('/history')} className="text-blue-600 hover:underline">
          &larr; Back to History
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700 w-1/3">Parameter</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Older Report</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Newer Report</th>
              <th className="p-4 font-semibold text-slate-700 text-center">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{row.name}</td>
                
                <td className="p-4 text-center">
                  {row.value_a !== "Not tested" ? (
                    <div>
                      <div className="font-semibold">{row.value_a}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${RISK_STYLES[row.risk_a]}`}>
                        {row.risk_a}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Not tested</span>
                  )}
                </td>
                
                <td className="p-4 text-center">
                  {row.value_b !== "Not tested" ? (
                    <div>
                      <div className="font-semibold">{row.value_b}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${RISK_STYLES[row.risk_b]}`}>
                        {row.risk_b}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Not tested</span>
                  )}
                </td>

                <td className="p-4 text-center">
                  {DIR_ICONS[row.direction] || row.direction}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-8 text-slate-500">
                  No parameters found to compare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
