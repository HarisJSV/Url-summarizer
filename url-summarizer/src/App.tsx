import { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [points, setPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    setSummary('');
    setPoints([]);
    try {
      const res = await fetch('http://localhost:3000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setSummary(data.summary);
      setPoints(data.points);
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded p-6 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-4">URL Summarizer</h1>
        <input
          type="text"
          className="w-full border border-gray-300 p-2 mb-4 rounded"
          placeholder="Paste a URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleSummarize}
          disabled={loading}
        >
          {loading ? 'Summarizing...' : 'Summarize'}
        </button>

        {summary && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Summary:</h2>
            <p className="text-gray-800">{summary}</p>
          </div>
        )}

        {points.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Key Points:</h2>
            <ul className="list-disc ml-6">
              {points.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
