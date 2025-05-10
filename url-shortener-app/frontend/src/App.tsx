import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

interface UrlEntry {
  id: string;
  shortUrl: string;
  longUrl: string;
  slug: string;
  createdAt: Date;
  visits: number;
  userId?: string;
}

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/urls');
      setUrls(response.data);
    } catch (err) {
      setError('Failed to fetch URLs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/shorten', {
        longUrl,
        customSlug: customSlug || undefined
      });
      setUrls([...urls, response.data]);
      setLongUrl('');
      setCustomSlug('');
      toast.success('URL shortened successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to shorten URL');
      toast.error(err.response?.data?.error || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleSlugChange = async (oldSlug: string, newSlug: string) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/urls/${oldSlug}`, {
        newSlug
      });
      setUrls(urls.map(url => url.slug === oldSlug ? response.data : url));
      toast.success('Slug updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update slug');
    }
  };

  return (
    <div className="App">
      <ToastContainer position="top-right" />
      <div className="container">
        <h1>URL Shortener</h1>
        
        <form onSubmit={handleSubmit} className="url-form">
          <div className="input-group">
            <input
              type="url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="Enter long URL"
              required
            />
            <input
              type="text"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              placeholder="Custom slug (optional)"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten'}
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="urls-list">
          <h2>Your Shortened URLs</h2>
          {urls.map((url) => (
            <div key={url.id} className="url-item">
              <div className="url-header">
                <h3>Short URL</h3>
                <div className="url-actions">
                  <button onClick={() => copyToClipboard(url.shortUrl)}>
                    Copy
                  </button>
                  <input
                    type="text"
                    value={url.slug}
                    onChange={(e) => handleSlugChange(url.slug, e.target.value)}
                    placeholder="Edit slug"
                  />
                </div>
              </div>
              <a href={url.shortUrl} target="_blank" rel="noopener noreferrer">
                {url.shortUrl}
              </a>
              <p><strong>Original URL:</strong> {url.longUrl}</p>
              <p><strong>Visits:</strong> {url.visits}</p>
              <p><strong>Created:</strong> {new Date(url.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App; 