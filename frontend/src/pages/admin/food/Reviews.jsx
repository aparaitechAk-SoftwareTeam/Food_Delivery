import React, { useState, useEffect } from 'react';
import { Star, Check, EyeOff, Trash2, RefreshCw, MessageSquare, AlertCircle, Search, BarChart2, Award, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0, highestRatedFood: 'N/A', lowestRatedFood: 'N/A' });
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const loadReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const queryParams = new URLSearchParams({
        page,
        limit,
        search,
        rating: ratingFilter,
        status: statusFilter
      });
      const response = await fetch(`${API_BASE_URL}/admin/reviews?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data && data.reviews) {
        setReviews(data.reviews);
        setTotal(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, ratingFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadReviews();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRatingFilter('');
    setStatusFilter('');
    setPage(1);
    // Directly load
    setTimeout(loadReviews, 0);
  };

  const handleUpdateStatus = async (reviewId, newStatus) => {
    setUpdatingId(reviewId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, status: newStatus } : r));
        // Reload dashboard stats
        loadReviews();
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
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setReviews(prev => prev.filter(r => r._id !== reviewId));
        // Reload dashboard stats
        loadReviews();
      } else {
        alert('Failed to delete review.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate local breakdown for CSS charts
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (ratingBreakdown[r.rating] !== undefined) {
      ratingBreakdown[r.rating]++;
    }
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" /> Customer Reviews Dashboard
              </h2>
              <p className="text-xs text-gray-500 font-medium">Monitor customer ratings, search feedbacks, and moderate food review submissions.</p>
            </div>
            <button 
              onClick={loadReviews}
              className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 1. Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-xl text-red-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Reviews</span>
                <span className="text-xl font-black text-slate-800">{stats.totalReviews}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Average Rating</span>
                <span className="text-xl font-black text-slate-800">{stats.averageRating} / 5.0</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Award className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Highest Rated Food</span>
                <span className="text-sm font-black text-slate-700 truncate block">{stats.highestRatedFood}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Lowest Rated Food</span>
                <span className="text-sm font-black text-slate-700 truncate block">{stats.lowestRatedFood}</span>
              </div>
            </div>
          </div>

          {/* 2. Visual Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Rating distribution chart */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm col-span-2">
              <h3 className="text-xs font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-slate-500" /> Rating Distribution (Current View)
              </h3>
              <div className="flex flex-col gap-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingBreakdown[rating];
                  const totalCount = reviews.length;
                  const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-bold text-gray-500">{rating} Star</span>
                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-bold text-gray-700">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dashboard tips */}
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm mb-1">Feedback Analytics</h4>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Real-time aggregation counts, average rating metrics, and review statuses update automatically upon user action. Approved reviews are visible on the customer store details immediately.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                <span className="text-[9px] font-bold tracking-wider uppercase opacity-75">Customer Reviews Portal</span>
                <MessageSquare className="w-5 h-5 opacity-70" />
              </div>
            </div>
          </div>

          {/* 3. Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="w-full md:w-1/3 relative">
              <input
                type="text"
                placeholder="Search food, user name, or review comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-red-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </form>

            <div className="w-full md:w-auto flex flex-wrap gap-3 items-center">
              <select
                value={ratingFilter}
                onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Hidden">Hidden</option>
              </select>

              <button
                onClick={handleResetFilters}
                className="px-3 py-2 border border-gray-250 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* 4. Table Board Container */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Customer</th>
                    <th className="pb-3 text-left">Food Item</th>
                    <th className="pb-3 text-center">Rating</th>
                    <th className="pb-3 style={{ width: '30%' }} text-left">Review Details</th>
                    <th className="pb-3 text-center">Order Info</th>
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
                        <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-14 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                        <td className="py-4"><div className="w-12 h-8 bg-slate-200 rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-gray-400 py-12 font-semibold">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <span>No customer reviews matching the criteria were found.</span>
                      </td>
                    </tr>
                  ) : (
                    reviews.map(review => (
                      <tr key={review._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            {review.user?.profilePhoto ? (
                              <img src={review.user.profilePhoto} className="w-8 h-8 rounded-full object-cover" alt="" />
                            ) : (
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                {review.user?.name ? review.user.name.charAt(0) : 'A'}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-800 block">{review.user?.name || 'Anonymous'}</span>
                              <span className="text-[9px] text-slate-400 font-semibold">{review.user?.email || ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            {review.food?.image && (
                              <img src={review.food.image} className="w-9 h-9 rounded-lg object-cover" alt="" />
                            )}
                            <span className="font-bold text-slate-700">{review.food?.name || 'General Feedback'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{review.rating}</span>
                          </div>
                        </td>
                        <td className="py-3.5 max-w-[320px]">
                          {review.title && <h5 className="font-bold text-slate-800 mb-0.5">{review.title}</h5>}
                          <p className="text-slate-600 font-medium leading-relaxed mb-2">
                            {review.comment || <span className="italic text-slate-400">No comment left</span>}
                          </p>
                          
                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-1.5 mt-1">
                              {review.images.map((imgUrl, idx) => (
                                <a key={idx} href={imgUrl} target="_blank" rel="noreferrer">
                                  <img 
                                    src={imgUrl} 
                                    className="w-10 h-10 rounded border border-slate-200 object-cover hover:scale-105 transition-transform" 
                                    alt="" 
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="font-bold text-slate-600 block">#{review.order?.orderNumber || 'N/A'}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${review.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
                <span className="text-gray-400 text-xs">
                  Showing page <strong className="text-slate-700">{page}</strong> of <strong className="text-slate-700">{totalPages}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => prev - 1)}
                    className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => prev + 1)}
                    className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reviews;
