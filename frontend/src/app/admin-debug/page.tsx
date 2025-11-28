'use client';

import { useEffect, useState } from 'react';

export default function AdminDebugPage() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    // Get all localStorage data
    const data = {
      admin_token: localStorage.getItem('admin_token'),
      admin_user: localStorage.getItem('admin_user'),
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
    };

    // Try to parse JSON
    const parsed: any = {};
    
    if (data.admin_user) {
      try {
        parsed.admin_user = JSON.parse(data.admin_user);
      } catch (e) {
        parsed.admin_user = 'PARSE ERROR: ' + e;
      }
    }

    if (data.user) {
      try {
        parsed.user = JSON.parse(data.user);
      } catch (e) {
        parsed.user = 'PARSE ERROR: ' + e;
      }
    }

    // Decode JWT token to check expiry
    if (data.admin_token) {
      try {
        const parts = data.admin_token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          parsed.admin_token_decoded = payload;
          
          // Check if expired
          const now = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp < now;
          const timeLeft = payload.exp - now;
          
          parsed.admin_token_status = {
            isExpired,
            expiresAt: new Date(payload.exp * 1000).toLocaleString(),
            timeLeftSeconds: timeLeft,
            timeLeftMinutes: Math.floor(timeLeft / 60),
          };
        }
      } catch (e) {
        parsed.admin_token_decoded = 'DECODE ERROR: ' + e;
      }
    }

    setInfo({ raw: data, parsed });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Authentication Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => {
                console.log('Navigating to /admin/dashboard');
                window.location.href = '/admin/dashboard';
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
            >
              🚀 Go to Admin Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/admin/users'}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Go to Admin Users
            </button>
            <button
              onClick={() => window.location.href = '/admin/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Admin Login
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All & Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm mb-6">
          <h2 className="text-xl font-bold mb-4 text-green-300">Raw localStorage Data:</h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-yellow-400 font-bold">admin_token:</div>
              <div className="pl-4">{info.raw?.admin_token || '(null)'}</div>
            </div>

            <div>
              <div className="text-yellow-400 font-bold">admin_user:</div>
              <div className="pl-4 break-all">{info.raw?.admin_user || '(null)'}</div>
            </div>

            <div>
              <div className="text-yellow-400 font-bold">token:</div>
              <div className="pl-4">{info.raw?.token || '(null)'}</div>
            </div>

            <div>
              <div className="text-yellow-400 font-bold">user:</div>
              <div className="pl-4 break-all">{info.raw?.user || '(null)'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Parsed Data & Token Status:</h2>
          
          {info.parsed?.admin_token_status && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-bold text-lg mb-2">Admin Token Status:</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-bold">Expired: </span>
                  <span className={info.parsed.admin_token_status.isExpired ? 'text-red-600 font-bold text-lg' : 'text-green-600 font-bold text-lg'}>
                    {info.parsed.admin_token_status.isExpired ? '❌ YES - TOKEN EXPIRED!' : '✅ NO - Valid'}
                  </span>
                </div>
                <div>
                  <span className="font-bold">Expires At: </span>
                  {info.parsed.admin_token_status.expiresAt}
                </div>
                <div>
                  <span className="font-bold">Time Left: </span>
                  {info.parsed.admin_token_status.timeLeftMinutes} minutes ({info.parsed.admin_token_status.timeLeftSeconds} seconds)
                </div>
              </div>
              {info.parsed.admin_token_status.isExpired && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                  <p className="text-red-800 font-bold">⚠️ YOUR TOKEN HAS EXPIRED!</p>
                  <p className="text-sm mt-1">You need to login again to get a new token.</p>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/admin/login';
                    }}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Clear & Go to Admin Login
                  </button>
                </div>
              )}
            </div>
          )}
          
          {info.parsed?.admin_user && (
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <h3 className="font-bold text-lg mb-2">admin_user:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(info.parsed.admin_user, null, 2)}
              </pre>
              <div className="mt-2">
                <span className="font-bold">isAdmin: </span>
                <span className={info.parsed.admin_user?.isAdmin ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {String(info.parsed.admin_user?.isAdmin)}
                </span>
              </div>
            </div>
          )}

          {info.parsed?.user && (
            <div className="mb-4 p-4 bg-purple-50 rounded">
              <h3 className="font-bold text-lg mb-2">user:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(info.parsed.user, null, 2)}
              </pre>
              <div className="mt-2">
                <span className="font-bold">isAdmin: </span>
                <span className={info.parsed.user?.isAdmin ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {String(info.parsed.user?.isAdmin)}
                </span>
              </div>
            </div>
          )}

          {!info.parsed?.admin_user && !info.parsed?.user && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-bold">❌ NO USER DATA FOUND</p>
              <p className="text-sm mt-2">You need to login first!</p>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6">
          <h3 className="font-bold mb-2">What to do:</h3>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>If you see NO tokens above, click "Go to Admin Login" and login</li>
            <li>If you see tokens but isAdmin is <strong>false</strong>, you need to grant admin access in database</li>
            <li>If you see tokens but isAdmin is <strong>true</strong>, something else is wrong - share this page with support</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
