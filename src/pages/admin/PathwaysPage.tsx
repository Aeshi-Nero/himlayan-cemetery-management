import React, { useEffect, useState } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { PathNode } from '../../types';

export const PathwaysPage: React.FC = () => {
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await apiClient.get('/pathfinding/nodes');
        if (res.data?.success) setNodes(res.data.data);
      } catch (err) {
        console.error('Error fetching path nodes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">GIS Graph Engine</span>
        <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">A* Pathway Network Nodes</h1>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading pathway graph nodes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Node ID</th>
                  <th className="p-4">Landmark Label</th>
                  <th className="p-4">Latitude</th>
                  <th className="p-4">Longitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nodes.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-700">{n.id}</td>
                    <td className="p-4 font-semibold text-slate-900">{n.node_label || 'Path Junction'}</td>
                    <td className="p-4 font-mono text-slate-500">{n.lat}</td>
                    <td className="p-4 font-mono text-slate-500">{n.lng}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
