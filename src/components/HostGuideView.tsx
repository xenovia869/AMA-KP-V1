import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  Terminal, 
  GitBranch, 
  Database, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldAlert,
  HardDrive,
  Laptop
} from 'lucide-react';
import { NetworkInfo } from '../types';

export const HostGuideView: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/system/network-info')
      .then((res) => res.json())
      .then((data) => setNetworkInfo(data))
      .catch((err) => console.error('Failed to load network info:', err));
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <Server className="w-7 h-7 text-emerald-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Local PC Hosting & Static IP Configuration
          </h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Complete engineering guide to deploy, version-control with GitHub, and host this system on your personal computer on a local static IP.
        </p>
      </div>

      {/* Network Interface Status Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-7 text-white shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium border border-emerald-400/30">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Host Node Status: Active & Bound to 0.0.0.0</span>
            </div>
            <h2 className="text-xl font-bold">Your Local Station Connection</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              When running on your PC, devices on your local network (phones, tablets, lab computers) can access this app via your Static IP:
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {networkInfo?.ip_addresses && networkInfo.ip_addresses.length > 0 ? (
                networkInfo.ip_addresses.map((net, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs">
                    <span className="text-slate-400">{net.iface}:</span>
                    <strong className="text-emerald-400">http://{net.address}:{networkInfo.port}</strong>
                    <button
                      onClick={() => copyToClipboard(`http://${net.address}:${networkInfo.port}`, `ip-${i}`)}
                      className="text-slate-400 hover:text-white ml-1"
                    >
                      {copiedKey === `ip-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-xs text-emerald-400">
                  http://&lt;YOUR_PC_STATIC_IP&gt;:3000
                </div>
              )}
            </div>
          </div>

          {/* Direct DB Download */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-700 text-center shrink-0 min-w-[240px]">
            <Database className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">SQLite Database File</p>
            <p className="text-[11px] text-slate-400 mb-3 font-mono">attendance.db</p>
            <a
              href="/api/db/download"
              download="attendance.db"
              className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .db File</span>
            </a>
          </div>
        </div>
      </div>

      {/* Guide Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Setting Static IP in Windows */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
              1
            </span>
            <h3 className="font-bold text-slate-900 text-base">Assign Static IP in Windows</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ensure your PC always keeps the same IP address on your local router:
          </p>
          <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside bg-slate-50 p-4 rounded-lg border border-slate-200">
            <li>Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300">Win + R</kbd>, type <code className="font-mono text-blue-700">ncpa.cpl</code> and hit Enter.</li>
            <li>Right-click your active Network Adapter (Ethernet or Wi-Fi) & select <strong>Properties</strong>.</li>
            <li>Double-click <strong>Internet Protocol Version 4 (TCP/IPv4)</strong>.</li>
            <li>Select <strong>"Use the following IP address"</strong>:
              <div className="mt-2 ml-4 font-mono text-[11px] text-slate-800 space-y-1">
                <div>IP address: <span className="font-bold text-blue-600">192.168.1.200</span> (example)</div>
                <div>Subnet mask: <span className="font-bold text-slate-600">255.255.255.0</span></div>
                <div>Default gateway: <span className="font-bold text-slate-600">192.168.1.1</span> (your router)</div>
                <div>Preferred DNS: <span className="font-bold text-slate-600">8.8.8.8</span></div>
              </div>
            </li>
            <li>Click <strong>OK</strong> to save.</li>
          </ol>
        </div>

        {/* Step 2: Windows Firewall Port 3000 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
              2
            </span>
            <h3 className="font-bold text-slate-900 text-base">Allow Port 3000 in Windows Firewall</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Allow incoming connections so other devices on your local network can reach your kiosk:
          </p>
          <div className="bg-slate-900 rounded-lg p-3 text-slate-100 font-mono text-xs relative group">
            <div className="text-[11px] text-slate-400 mb-1"># Run in Command Prompt / PowerShell as Administrator:</div>
            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
              netsh advfirewall firewall add rule name="Chronos Attendance Kiosk" dir=in action=allow protocol=TCP localport=3000
            </pre>
            <button
              onClick={() => copyToClipboard('netsh advfirewall firewall add rule name="Chronos Attendance Kiosk" dir=in action=allow protocol=TCP localport=3000', 'firewall')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              {copiedKey === 'firewall' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            After this, any phone, laptop, or tablet connected to your Wi-Fi can navigate to <code className="font-mono text-blue-600">http://192.168.1.200:3000</code>.
          </p>
        </div>

        {/* Step 3: GitHub Version Control Setup */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
              3
            </span>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-700" />
              Version Control with GitHub
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Push this project to your GitHub account to keep your code safe and track changes:
          </p>
          <div className="bg-slate-900 rounded-lg p-3 text-slate-100 font-mono text-xs relative space-y-1">
            <div className="text-emerald-400">git init</div>
            <div className="text-emerald-400">git add .</div>
            <div className="text-emerald-400">git commit -m "feat: Initial Time In and Out system with SQLite & Excel export"</div>
            <div className="text-emerald-400">git branch -M main</div>
            <div className="text-emerald-400">git remote add origin https://github.com/&lt;USERNAME&gt;/chronos-attendance.git</div>
            <div className="text-emerald-400">git push -u origin main</div>
            <button
              onClick={() => copyToClipboard('git init\ngit add .\ngit commit -m "feat: Initial Time In and Out system with SQLite & Excel export"\ngit branch -M main\ngit remote add origin https://github.com/<USERNAME>/chronos-attendance.git\ngit push -u origin main', 'git')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              {copiedKey === 'git' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Step 4: Running on Boot / Auto-Start */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
              4
            </span>
            <h3 className="font-bold text-slate-900 text-base">Running on Local PC (Dev & Production)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Run the Node.js Express server on your PC:
          </p>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded text-slate-100 font-mono">
              <span className="text-slate-400"># Start interactive full-stack app:</span>
              <div className="text-emerald-400">npm run dev</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded text-slate-100 font-mono">
              <span className="text-slate-400"># Or run quietly in background with PM2:</span>
              <div className="text-emerald-400">npm install -g pm2</div>
              <div className="text-emerald-400">pm2 start server.ts --name "attendance-kiosk"</div>
              <div className="text-emerald-400">pm2 save</div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            The SQLite database is stored locally in <code className="font-mono text-slate-800">attendance.db</code>. It persists across reboots with zero external cloud dependencies.
          </p>
        </div>
      </div>
    </div>
  );
};
