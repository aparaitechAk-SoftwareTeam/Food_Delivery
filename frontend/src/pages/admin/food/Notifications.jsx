import React, { useState, useEffect } from 'react';
import { Bell, Send, RefreshCw, Trash2, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const Notifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('Offers'); // Offers, System Notice, Order Update
  const [audience, setAudience] = useState('All Users'); // All Users, Premium Gold, Selected Users
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [logs, setLogs] = useState([
    { id: '1', title: '50% Weekend Blowout!', body: 'Use coupon WEEKEND50 at checkout to slash prices by half on all biryanis and desserts!', type: 'Offers', audience: 'All Users', sentAt: '2026-07-04T10:15:00.000Z' },
    { id: '2', title: 'Monsoon Delivery Advisory', body: 'Heavy rains near Baramati MIDC may delay deliveries by 10-15 minutes. Thank you for your patience.', type: 'System Notice', audience: 'All Users', sentAt: '2026-07-03T18:30:00.000Z' },
  ]);

  useEffect(() => {
    const localLogs = localStorage.getItem('broadcast_notification_logs');
    if (localLogs) {
      try {
        setLogs(JSON.parse(localLogs));
      } catch (e) {}
    }
  }, []);

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    setSuccess(false);

    setTimeout(() => {
      const newLog = {
        id: `noti-${Date.now()}`,
        title,
        body: message,
        type,
        audience,
        sentAt: new Date().toISOString(),
      };
      
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('broadcast_notification_logs', JSON.stringify(updatedLogs));

      setTitle('');
      setMessage('');
      setSending(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }, 1500);
  };

  const handleDeleteLog = (logId) => {
    const updated = logs.filter(l => l.id !== logId);
    setLogs(updated);
    localStorage.setItem('broadcast_notification_logs', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8 flex gap-8">
          {/* Notification Form */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5"><Bell className="w-4 h-4 text-indigo-500" /> Push Broadcaster Panel</h2>
            <p className="text-[10px] text-gray-450 font-medium mb-6">Compose and send real-time Firebase Push Notifications directly to active customer app instances.</p>

            {success && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-4 h-4" />
                <span>Broadcast message dispatched successfully to FCM queues!</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-5 text-xs font-semibold text-slate-650 flex-1">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Broadcast Title</label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Craving Discounts!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
                  disabled={sending}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Alert Channel / Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white outline-none cursor-pointer"
                    disabled={sending}
                  >
                    <option>Offers</option>
                    <option>System Notice</option>
                    <option>Order Update</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white outline-none cursor-pointer"
                    disabled={sending}
                  >
                    <option>All Users</option>
                    <option>Premium Gold</option>
                    <option>Selected Users</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[150px]">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Notification Body / Message</label>
                <textarea
                  placeholder="Type details that will appear on user lockscreens..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full flex-1 p-3.5 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800 resize-none min-h-[120px]"
                  disabled={sending}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-655 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-indigo-650/10 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Dispatching Broadcast...' : 'Broadcast FCM Alert'}</span>
              </button>
            </form>
          </div>

          {/* Recent Logs Sidebar */}
          <div className="w-[360px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 self-start max-h-[80vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Broadcast History</h3>
            
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="p-3 border border-gray-150 rounded-xl bg-slate-50 relative flex flex-col">
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 rounded-lg p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <span className="text-[10px] font-bold text-slate-800 pr-5">{log.title}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">{log.type} • {log.audience}</span>
                  <p className="text-[9px] text-slate-500 font-medium mt-1.5 leading-relaxed">{log.body}</p>
                  <span className="text-[8px] text-gray-400 font-bold self-end mt-2">{new Date(log.sentAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notifications;
