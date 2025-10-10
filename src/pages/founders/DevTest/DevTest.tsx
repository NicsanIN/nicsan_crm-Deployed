import { Card } from '../../../components/common/Card';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

function PageTests() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { userChanged } = useUserChange();
    
    // Simple run-time tests for core form math (no framework)
    type Case = { name: string; total: number; pct?: number; amt?: number; expectAmt?: number; expectPct?: number };
    const cases: Case[] = [
      { name: "pct→amt", total: 10000, pct: 10, expectAmt: 1000 },
      { name: "amt→pct", total: 20000, amt: 500, expectPct: 2.5 },
      { name: "zero-total", total: 0, pct: 10, expectAmt: 0 },
    ];
    const results = cases.map(c => {
      const calcAmt = c.pct != null ? Math.round((c.total * c.pct) / 100) : (c.amt ?? 0);
      const calcPct = c.amt != null && c.total > 0 ? +( (c.amt / c.total) * 100 ).toFixed(1) : (c.pct ?? 0);
      const passAmt = c.expectAmt == null || c.expectAmt === calcAmt;
      const passPct = c.expectPct == null || c.expectPct === calcPct;
      return { ...c, calcAmt, calcPct, pass: passAmt && passPct };
    });
    const allPass = results.every(r => r.pass);
    return (
      <Card title="Dev/Test" desc="Lightweight checks for cashback math">
        <div className="text-sm mb-2">Overall: {allPass ? <span className="text-emerald-700">✅ PASS</span> : <span className="text-rose-700">❌ FAIL</span>}</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2">Case</th><th>Total</th><th>Input %</th><th>Input ₹</th><th>Calc ₹</th><th>Calc %</th><th>Expected ₹</th><th>Expected %</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r,i)=> (
                <tr key={i} className="border-t">
                  <td className="py-2">{r.name}</td>
                  <td>{r.total}</td>
                  <td>{r.pct ?? "—"}</td>
                  <td>{r.amt ?? "—"}</td>
                  <td>{r.calcAmt}</td>
                  <td>{r.calcPct}</td>
                  <td>{r.expectAmt ?? "—"}</td>
                  <td>{r.expectPct ?? "—"}</td>
                  <td>{r.pass ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

export default PageTests;
