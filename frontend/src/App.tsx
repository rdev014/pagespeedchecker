import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Opportunity {
  title: string;
  description: string;
  savings: number;
  displayValue: string;
  details?: string;
}

interface PageSpeedResult {
  url: string;
  strategy: string;
  timestamp: string;
  performanceScore: number;
  metrics: PageSpeedMetrics;
  opportunities: Opportunity[];
  screenshot: string | null;
  diagnostics?: {
    [key: string]: {
      items: Array<{
        url?: string;
        totalBytes?: number;
        wastedBytes?: number;
        wastedPercent?: number;
        label?: string;
      }>;
    };
  };
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedOpportunity, setExpandedOpportunity] = useState<number | null>(null);
  const [showLightEffect, setShowLightEffect] = useState(false);

  const checkSpeed = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    // Trigger light effect before analysis starts
    setShowLightEffect(true);
    setTimeout(() => {
      setShowLightEffect(false);
      setIsAnalyzing(true);
    }, 800);

    try {
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

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to check page speed';
        
        try {
          const errorData = JSON.parse(errorText) as ApiError;
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(responseText) as ApiResponse | ApiError;

      if ('error' in data) {
        throw new Error(data.message);
      }

      if (data.success && data.data) {
        setResult(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('PageSpeed check failed:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsAnalyzing(false), 500);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 50) return 'Needs Work';
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

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleOpportunity = (index: number) => {
    setExpandedOpportunity(expandedOpportunity === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with glass effect */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-block bg-gray-800/50 backdrop-blur-md rounded-xl px-8 py-6 shadow-lg border border-gray-700/50"
            whileHover={{ scale: 1.02 }}
          >
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-3">
              PageSpeed<span className="text-white">Analytics</span>
            </h1>
            <p className="text-lg text-gray-300">
              Optimize your website with professional performance insights
            </p>
          </motion.div>
        </motion.div>

        {/* Input Card with glass effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-10 border border-gray-700/50"
        >
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                Website URL
              </label>
              <motion.input
                id="url"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-gray-700/70 border border-gray-600/50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all"
                disabled={loading}
                whileFocus={{ 
                  scale: 1.01,
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                }}
              />
            </div>
            
            <div className="w-full md:w-auto">
              <label htmlFor="strategy" className="block text-sm font-medium text-gray-300 mb-2">
                Device
              </label>
              <motion.select
                id="strategy"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as 'mobile' | 'desktop')}
                className="w-full bg-gray-700/70 border border-gray-600/50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
                disabled={loading}
                whileFocus={{
                  scale: 1.01,
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)"
                }}
              >
                <option value="mobile">📱 Mobile</option>
                <option value="desktop">💻 Desktop</option>
              </motion.select>
            </div>
            
            <div className="relative w-full md:w-auto">
              {/* Light effect container */}
              <AnimatePresence>
                {showLightEffect && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-lg blur-md"
                    transition={{ duration: 0.5 }}
                  />
                )}
              </AnimatePresence>
              
              <motion.button
                onClick={checkSpeed}
                disabled={loading}
                className="relative w-full px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-70 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Check Speed
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-900/50 border border-red-700 rounded-xl p-4 mb-8 backdrop-blur-sm"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="font-medium text-red-100">Error</p>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analyzing Animation */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
            >
              <div className="text-center">
                {/* Enhanced animation with light streaks */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative mb-8 mx-auto w-32 h-32"
                >
                  {/* Light streaks */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ rotate: i * 90, opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                    </motion.div>
                  ))}
                  
                  {/* Main orb */}
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                    }}
                    className="w-full h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-xl flex items-center justify-center"
                    style={{
                      boxShadow: "0 0 40px rgba(16, 185, 129, 0.5)"
                    }}
                  >
                    <div className="w-28 h-28 rounded-full bg-gray-900 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                  </motion.div>
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-white mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Analyzing Performance
                </motion.h2>
                <motion.p 
                  className="text-xl text-gray-300 mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Scanning {url} on {strategy}...
                </motion.p>
                <motion.div 
                  className="mt-6 text-gray-400 flex justify-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="inline-block w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="inline-block w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="inline-block w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  <span className="inline-block w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Performance Score Card */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-gray-700/50"
              >
                {/* Decorative elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-blue-600/20 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-cyan-600/20 blur-3xl"></div>
                
                <h2 className="text-2xl font-bold text-white mb-6">
                  Performance Score
                </h2>
                
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`text-8xl font-extrabold mb-4 ${getScoreColor(result.performanceScore)}`}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {result.performanceScore}
                  </motion.div>
                  
                  <motion.div className="text-xl font-medium text-gray-300 mb-2">
                    {getScoreLabel(result.performanceScore)}
                  </motion.div>
                  
                  <motion.div className="flex items-center mb-8">
                    <div className="text-sm text-gray-400 flex items-center">
                      <span className="mr-2">
                        {result.strategy === 'mobile' ? '📱 Mobile' : '💻 Desktop'}
                      </span>
                      <span>•</span>
                      <span className="ml-2">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                  
                  {/* Score meter */}
                  <div className="w-full max-w-md">
                    <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" 
                        initial={{ width: 0 }}
                        animate={{ width: `${result.performanceScore}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-1 w-full bg-white/10 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>0</span>
                      <span>50</span>
                      <span>90</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Core Web Vitals */}
              <motion.div 
                className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-700/50"
              >
                <h2 className="text-2xl font-bold text-white mb-6">
                  Core Web Vitals
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(result.metrics).map(([key, metric]) => (
                    <motion.div 
                      key={key}
                      className="bg-gray-700/50 border border-gray-600/50 rounded-xl p-6 backdrop-blur-sm hover:border-cyan-500 transition-colors"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="font-medium text-gray-300 mb-3 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <div className={`text-3xl font-bold mb-1 ${getScoreColor(formatMetricScore(metric.score))}`}>
                        {metric.displayValue}
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm text-gray-400 mr-2">
                          Score: {formatMetricDisplay(metric.score)}/100
                        </div>
                        <div className="ml-auto">
                          <div className="h-2 w-16 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-current" 
                              style={{ width: `${formatMetricDisplay(metric.score)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-400">
                        Numeric value: {metric.numericValue.toFixed(2)}ms
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Opportunities */}
              {result.opportunities && result.opportunities.length > 0 && (
                <motion.div 
                  className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-700/50"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Optimization Opportunities
                  </h2>
                  
                  <div className="space-y-4">
                    {result.opportunities.map((opportunity: Opportunity, index: number) => (
                      <motion.div 
                        key={index}
                        className={`bg-gray-700/50 border-l-4 border-cyan-500 rounded-r-lg backdrop-blur-sm group transition-all ${expandedOpportunity === index ? 'pb-4' : ''}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleOpportunity(index)}
                        >
                          <div className="flex items-start">
                            <div className="bg-cyan-500/10 p-2 rounded-lg mr-3 group-hover:bg-cyan-500/20 transition-colors">
                              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-white">{opportunity.title}</h3>
                              <p className="text-sm text-gray-300 mt-1">{opportunity.description}</p>
                              {opportunity.displayValue && (
                                <div className="mt-2 flex items-center text-sm text-cyan-400">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                  </svg>
                                  Potential savings: {opportunity.displayValue}
                                </div>
                              )}
                            </div>
                            <motion.div
                              animate={{ rotate: expandedOpportunity === index ? 180 : 0 }}
                              className="text-gray-400 ml-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                              </svg>
                            </motion.div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedOpportunity === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden px-4"
                            >
                              <div className="border-t border-gray-600/50 pt-4 mt-2">
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Details:</h4>
                                <p className="text-sm text-gray-400">
                                  {opportunity.details || 'No additional details available.'}
                                </p>
                                {result.diagnostics?.[opportunity.title] && (
                                  <div className="mt-3">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Resources:</h4>
                                    <ul className="text-sm text-gray-400 space-y-1">
                                      {result.diagnostics[opportunity.title].items.map((item, i) => (
                                        <li key={i} className="flex justify-between">
                                          <span>{item.label || item.url || `Resource ${i + 1}`}</span>
                                          {item.wastedBytes && (
                                            <span className="text-cyan-400">
                                              {formatBytes(item.wastedBytes)} ({item.wastedPercent?.toFixed(1)}%)
                                            </span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}