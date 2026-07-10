import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, Dot
} from 'recharts';

const RISK_COLORS = {
  normal: "#16a34a", // green-600
  low: "#ea580c",    // orange-600 (Borderline)
  high: "#dc2626"    // red-600
};

// Custom Dot to color by risk level
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = RISK_COLORS[payload.risk_level] || RISK_COLORS.normal;
  
  return (
    <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />
  );
};

export default function Trends() {
  const [parameters, setParameters] = useState([]);
  const [selectedParam, setSelectedParam] = useState("");
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParameters();
  }, []);

  useEffect(() => {
    if (selectedParam) {
      fetchTrendData(selectedParam);
    }
  }, [selectedParam]);

  const fetchParameters = async () => {
    try {
      const res = await api.get('/trends/parameters');
      setParameters(res.data);
      if (res.data.length > 0) {
        setSelectedParam(res.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching parameters", err);
      setLoading(false);
    }
  };

  const fetchTrendData = async (paramId) => {
    try {
      const res = await api.get(`/trends/${paramId}`);
      setTrendData(res.data);
    } catch (err) {
      console.error("Error fetching trend data", err);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500">Loading trends...</div>;
  if (parameters.length === 0) return <div className="text-center py-20 text-slate-500">No historical data available. Upload some reports first!</div>;

  // Compute reference area (normal range)
  let yMin = "auto";
  let yMax = "auto";
  
  if (trendData && trendData.data.length > 0) {
    // Try to parse the normal range from the most recent data point
    const latestRange = trendData.data[trendData.data.length - 1].normal_range;
    if (latestRange) {
      const matches = latestRange.match(/(\d+\.?\d*)/g);
      if (matches && matches.length >= 2) {
        yMin = parseFloat(matches[0]);
        yMax = parseFloat(matches[1]);
      }
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded shadow-md">
          <p className="font-semibold text-slate-800 mb-1">{data.date}</p>
          <p className="text-sm text-slate-600">Value: <span className="font-bold">{data.original_value}</span></p>
          <p className="text-sm text-slate-600">Normal Range: {data.normal_range}</p>
          <p className="text-sm mt-1 uppercase" style={{color: RISK_COLORS[data.risk_level] || RISK_COLORS.normal, fontWeight: 600, fontSize: 12}}>
            Status: {data.risk_level}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Longitudinal Trends</h1>
      
      <div className="glass-card p-6 mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Parameter</label>
        <select 
          className="w-full md:w-1/2 p-2 border border-slate-300 rounded-md bg-white text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500"
          value={selectedParam}
          onChange={(e) => setSelectedParam(e.target.value)}
        >
          {parameters.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.data_points} reports)</option>
          ))}
        </select>
      </div>

      {trendData && trendData.data.length > 0 ? (
        <div className="glass-card p-6" style={{ height: 450 }}>
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">{trendData.parameter} Trend</h2>
          
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fill: '#64748b'}} tickMargin={10} />
              <YAxis domain={['auto', 'auto']} tick={{fill: '#64748b'}} />
              <Tooltip content={<CustomTooltip />} />
              
              {yMin !== "auto" && yMax !== "auto" && (
                <ReferenceArea y1={yMin} y2={yMax} fill="#bbf7d0" fillOpacity={0.4} />
              )}
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 7 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-slate-500">
          No trend data found for this parameter.
        </div>
      )}
    </div>
  );
}
