const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting to prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Google PageSpeed Insights API configuration
const PAGESPEED_API_KEY = process.env.GOOGLE_API_KEY;
const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

// Utility function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Main endpoint to check page speed
app.post('/api/pagespeed', async (req, res) => {
  try {
    const { url, strategy = 'mobile', categories = ['performance'] } = req.body;

    console.log('Received request:', { url, strategy, categories });

    // Check if API key is configured (warn but don't stop)
    if (!PAGESPEED_API_KEY) {
      console.warn('Warning: Google API key is not configured. Using limited quota.');
    }

    // Validate input
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a valid URL to analyze'
      });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid URL format (including http:// or https://)'
      });
    }

    // Validate strategy
    if (!['mobile', 'desktop'].includes(strategy)) {
      return res.status(400).json({
        error: 'Invalid strategy',
        message: 'Strategy must be either "mobile" or "desktop"'
      });
    }

    // Build API request parameters - fix the category parameter format
    const params = {
      url: url,
      strategy: strategy
    };

    // Only add API key if available (Google allows limited requests without key)
    if (PAGESPEED_API_KEY) {
      params.key = PAGESPEED_API_KEY;
    }

    // Add categories as separate parameters (Google API expects this format)
    categories.forEach(category => {
      params[`category`] = category;
    });

    console.log('Making request to Google API with params:', { 
      ...params, 
      key: params.key ? '[HIDDEN]' : 'No API key (using quota limits)' 
    });

    // Make request to Google PageSpeed Insights API
    const response = await axios.get(PAGESPEED_API_URL, {
      params: params,
      timeout: 30000 // 30 second timeout
    });

    const data = response.data;

    // Extract key metrics
    const lighthouseResult = data.lighthouseResult;
    const loadingExperience = data.loadingExperience;

    // Parse performance metrics
    const metrics = lighthouseResult.audits;
    const performanceScore = lighthouseResult.categories.performance.score * 100;

    // Core Web Vitals
    const coreWebVitals = {
      firstContentfulPaint: metrics['first-contentful-paint'],
      largestContentfulPaint: metrics['largest-contentful-paint'],
      firstInputDelay: metrics['max-potential-fid'],
      cumulativeLayoutShift: metrics['cumulative-layout-shift'],
      speedIndex: metrics['speed-index'],
      totalBlockingTime: metrics['total-blocking-time']
    };

    // Opportunities for improvement
    const opportunities = [];
    for (const [key, audit] of Object.entries(metrics)) {
      if (audit.details && audit.details.overallSavingsMs > 100) {
        opportunities.push({
          title: audit.title,
          description: audit.description,
          savings: audit.details.overallSavingsMs,
          displayValue: audit.displayValue
        });
      }
    }

    // Format response
    const result = {
      url: url,
      strategy: strategy,
      timestamp: new Date().toISOString(),
      performanceScore: Math.round(performanceScore),
      metrics: {
        firstContentfulPaint: {
          score: coreWebVitals.firstContentfulPaint.score,
          displayValue: coreWebVitals.firstContentfulPaint.displayValue,
          numericValue: coreWebVitals.firstContentfulPaint.numericValue
        },
        largestContentfulPaint: {
          score: coreWebVitals.largestContentfulPaint.score,
          displayValue: coreWebVitals.largestContentfulPaint.displayValue,
          numericValue: coreWebVitals.largestContentfulPaint.numericValue
        },
        speedIndex: {
          score: coreWebVitals.speedIndex.score,
          displayValue: coreWebVitals.speedIndex.displayValue,
          numericValue: coreWebVitals.speedIndex.numericValue
        },
        totalBlockingTime: {
          score: coreWebVitals.totalBlockingTime.score,
          displayValue: coreWebVitals.totalBlockingTime.displayValue,
          numericValue: coreWebVitals.totalBlockingTime.numericValue
        },
        cumulativeLayoutShift: {
          score: coreWebVitals.cumulativeLayoutShift.score,
          displayValue: coreWebVitals.cumulativeLayoutShift.displayValue,
          numericValue: coreWebVitals.cumulativeLayoutShift.numericValue
        }
      },
      opportunities: opportunities.slice(0, 5), // Top 5 opportunities
      fieldData: loadingExperience || null,
      screenshot: lighthouseResult.audits['final-screenshot']?.details?.data || null
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('PageSpeed API Error:', error.message);
    
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.error('Google API Error Response:', {
        status,
        data: errorData,
        url: error.config?.params?.url
      });
      
      const message = errorData?.error?.message || 'API request failed';
      
      if (status === 400) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Google API Error: ${message}`,
          details: errorData?.error?.errors || null
        });
      } else if (status === 403) {
        return res.status(403).json({
          error: 'API Key Error',
          message: 'Invalid or missing Google API key. Please check your API key configuration.'
        });
      } else if (status === 429) {
        return res.status(429).json({
          error: 'Rate Limited',
          message: 'Too many requests to Google API. Please try again later.'
        });
      }
      
      return res.status(status).json({
        error: 'API Error',
        message: `Google API Error: ${message}`
      });
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: 'Timeout',
        message: 'Request timed out. The website might be slow to respond.'
      });
    } else {
      console.error('Unexpected error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
});

// Endpoint to get multiple strategies at once
app.post('/api/pagespeed/compare', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid URL'
      });
    }

    // Make requests for both mobile and desktop
    const [mobileResponse, desktopResponse] = await Promise.allSettled([
      axios.get(PAGESPEED_API_URL, {
        params: { url, strategy: 'mobile', key: PAGESPEED_API_KEY, category: 'performance' },
        timeout: 30000
      }),
      axios.get(PAGESPEED_API_URL, {
        params: { url, strategy: 'desktop', key: PAGESPEED_API_KEY, category: 'performance' },
        timeout: 30000
      })
    ]);

    const results = {};

    if (mobileResponse.status === 'fulfilled') {
      const mobileScore = mobileResponse.value.data.lighthouseResult.categories.performance.score * 100;
      results.mobile = {
        score: Math.round(mobileScore),
        status: 'success'
      };
    } else {
      results.mobile = {
        score: null,
        status: 'failed',
        error: mobileResponse.reason.message
      };
    }

    if (desktopResponse.status === 'fulfilled') {
      const desktopScore = desktopResponse.value.data.lighthouseResult.categories.performance.score * 100;
      results.desktop = {
        score: Math.round(desktopScore),
        status: 'success'
      };
    } else {
      results.desktop = {
        score: null,
        status: 'failed',
        error: desktopResponse.reason.message
      };
    }

    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      data: results
    });

  } catch (error) {
    console.error('Compare API Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to compare mobile and desktop scores'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'PageSpeed Checker API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

app.listen(PORT, () => {
  console.log(`PageSpeed Checker API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});