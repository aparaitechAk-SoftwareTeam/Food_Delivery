import React, { useState, useEffect } from 'react';
import { Star, Check, EyeOff, Trash2, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews`);
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = async (reviewId, newStatus) => {
    setUpdatingId(reviewId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, status: newStatus } : r));
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setReviews(prev => prev.filter(r => r._id !== reviewId));
      } else {
        alert('Failed to delete review.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col min-h-[75vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-indigo-500" /> Reviews Moderation Board</h2>
                <p className="text-[10px] text-gray-450 font-medium">Approve, hide, or delete feedback left by customers on food items.</p>
              </div>

              <button 
                onClick={loadReviews}
                className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Reviews List */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Customer</th>
                    <th className="pb-3 text-left">Food Item</th>
                    <th className="pb-3 text-center">Rating</th>
                    <th className="pb-3 text-left">Comment</th>
                    <th className="pb-3 text-center">Moderation</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4"><div className="w-20 h-3 bg-slate-200 rounded" /></td>
                        <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded" /></td>
                        <td className="py-4"><div className="w-12 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-40 h-3 bg-slate-200 rounded" /></td>
                        <td className="py-4"><div className="w-14 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                        <td className="py-4"><div className="w-12 h-8 bg-slate-200 rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-400 py-12 font-semibold">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span>No customer reviews found.</span>
                      </td>
                    </tr>
                  ) : (
                    reviews.map(review => (
                      <tr key={review._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5">
                          <span className="font-bold text-slate-800 block">{review.user?.name || 'Anonymous'}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{review.user?.email || ''}</span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-700">{review.food?.name || 'General Feedback'}</td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{review.rating}</span>
                          </div>
                        </td>
                        <td className="py-3.5 max-w-[280px]">
                          <p className="text-slate-605 font-medium leading-relaxed truncate hover:text-clip hover:whitespace-normal">
                            {review.comment || <span className="italic text-slate-400">No comment left</span>}
                          </p>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${review.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : review.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {review.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {review.status !== 'Approved' && (
                              <button
                                onClick={() => handleUpdateStatus(review._id, 'Approved')}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Approve Review"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {review.status !== 'Hidden' && (
                              <button
                                onClick={() => handleUpdateStatus(review._id, 'Hidden')}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50/70 rounded-lg transition-colors cursor-pointer"
                                title="Hide Review"
                              >
                                <EyeOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="p-1.5 text-gray-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reviews;
