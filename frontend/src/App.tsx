import { useState } from 'react';

interface PageSpeedMetrics {
  firstContentfulPaint: {
    score: number;
    displayValue: string;
    numericValue: number;
  };
  largestContentfulPaint: {
    score: number;
    displayValue: string;
    numericValue: number;
  };
  speedIndex: {
    score: number;
    displayValue: string;
    numericValue: number;
  };
  totalBlockingTime: {
    score: number;
    displayValue: string;
    numericValue: number;
  };
  cumulativeLayoutShift: {
    score: number;
    displayValue: string;
    numericValue: number;
  };
}

interface PageSpeedResult {
  url: string;
  strategy: string;
  timestamp: string;
  performanceScore: number;
  metrics: PageSpeedMetrics;
  opportunities: Array<{
    title: string;
    description: string;
    savings: number;
    displayValue: string;
  }>;
  screenshot: string | null;
}

interface ApiResponse {
  success: boolean;
  data: PageSpeedResult;
}

interface ApiError {
  error: string;
  message: string;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [result, setResult] = useState<PageSpeedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSpeed = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Add protocol if missing
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Since backend is confirmed working on localhost:3000
      const response = await fetch('http://localhost:3000/api/pagespeed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          strategy: strategy,
          categories: ['performance']
        }),
      });

      // Check if response is ok and contains JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to check page speed';
        
        try {
          const errorData = JSON.parse(errorText) as ApiError;
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, use status text or default message
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      let data: ApiResponse | ApiError;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Invalid JSON response:', responseText);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        // Already handled above
        return;
      }

      const successData = data as ApiResponse;
      if (successData.success && successData.data) {
        setResult(successData.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('PageSpeed check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const formatMetricScore = (score: number | null) => {
    if (score === null) return 0;
    return Math.round(score * 100);
  };

  const formatMetricDisplay = (score: number | null) => {
    if (score === null) return 'N/A';
    return Math.round(score * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            PageSpeed Checker
          </h1>
          
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                id="url"
                type="text"
                placeholder="Enter website URL (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="strategy" className="block text-sm font-medium text-gray-700 mb-2">
                Device
              </label>
              <select
                id="strategy"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as 'mobile' | 'desktop')}
                className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
              </select>
            </div>
            
            <button
              onClick={checkSpeed}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
            >
              {loading ? 'Checking...' : 'Check Speed'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Performance Score */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Score</h2>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.performanceScore)}`}>
                  {result.performanceScore}
                </div>
                <div className="text-lg text-gray-600 mb-2">
                  {getScoreLabel(result.performanceScore)}
                </div>
                <div className="text-sm text-gray-500">
                  {result.strategy === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'} • {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Core Web Vitals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">First Contentful Paint</h3>
                  <div className={`text-2xl font-bold ${getScoreColor(formatMetricScore(result.metrics.firstContentfulPaint.score))}`}>
                    {result.metrics.firstContentfulPaint.displayValue}
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {formatMetricDisplay(result.metrics.firstContentfulPaint.score)}/100
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Largest Contentful Paint</h3>
                  <div className={`text-2xl font-bold ${getScoreColor(formatMetricScore(result.metrics.largestContentfulPaint.score))}`}>
                    {result.metrics.largestContentfulPaint.displayValue}
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {formatMetricDisplay(result.metrics.largestContentfulPaint.score)}/100
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Speed Index</h3>
                  <div className={`text-2xl font-bold ${getScoreColor(formatMetricScore(result.metrics.speedIndex.score))}`}>
                    {result.metrics.speedIndex.displayValue}
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {formatMetricDisplay(result.metrics.speedIndex.score)}/100
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Total Blocking Time</h3>
                  <div className={`text-2xl font-bold ${getScoreColor(formatMetricScore(result.metrics.totalBlockingTime.score))}`}>
                    {result.metrics.totalBlockingTime.displayValue}
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {formatMetricDisplay(result.metrics.totalBlockingTime.score)}/100
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Cumulative Layout Shift</h3>
                  <div className={`text-2xl font-bold ${getScoreColor(formatMetricScore(result.metrics.cumulativeLayoutShift.score))}`}>
                    {result.metrics.cumulativeLayoutShift.displayValue}
                  </div>
                  <div className="text-sm text-gray-500">
                    Score: {formatMetricDisplay(result.metrics.cumulativeLayoutShift.score)}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities */}
            {result.opportunities && result.opportunities.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Optimization Opportunities</h2>
                <div className="space-y-4">
                  {result.opportunities.map((opportunity, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h3 className="font-medium text-gray-800">{opportunity.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
                      {opportunity.displayValue && (
                        <p className="text-sm text-blue-600 mt-1">
                          Potential savings: {opportunity.displayValue}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}