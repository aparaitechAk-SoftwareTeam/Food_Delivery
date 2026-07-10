import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Info, RefreshCw, Check, Store } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const Settings = () => {
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [taxRate, setTaxRate] = useState(5); // in %
  const [currency, setCurrency] = useState('₹');
  const [unit, setUnit] = useState('Servings'); // Servings, Grams, Pieces
  const [prepTime, setPrepTime] = useState(25); // in minutes
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Restaurant details states
  const [restaurantName, setRestaurantName] = useState('FoodExpress Premium Kitchen');
  const [restaurantAddress, setRestaurantAddress] = useState('10, Vidyanagar Road, Baramati');
  const [restaurantDeliveryTime, setRestaurantDeliveryTime] = useState('20-25 mins');
  const [restaurantImage, setRestaurantImage] = useState('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80');
  const [restaurantIsOpen, setRestaurantIsOpen] = useState(true);
  const [restaurantCuisine, setRestaurantCuisine] = useState('South Indian, North Indian, Chinese, Desserts, Beverages');
  const [restaurantOfferPercentage, setRestaurantOfferPercentage] = useState(20);
  const [restaurantType, setRestaurantType] = useState('Multi Cuisine');

  useEffect(() => {
    // Load local storage values
    const localFee = localStorage.getItem('cms_delivery_fee');
    const localTax = localStorage.getItem('cms_tax_rate');
    const localCurrency = localStorage.getItem('cms_currency');
    const localUnit = localStorage.getItem('cms_unit');
    const localPrep = localStorage.getItem('cms_prep_time');

    if (localFee) setDeliveryFee(parseInt(localFee));
    if (localTax) setTaxRate(parseFloat(localTax));
    if (localCurrency) setCurrency(localCurrency);
    if (localUnit) setUnit(localUnit);
    if (localPrep) setPrepTime(parseInt(localPrep));

    // Fetch single restaurant details from public endpoint
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/restaurants`);
        const data = await res.json();
        if (data && data.length > 0) {
          const rest = data[0];
          setRestaurantName(rest.name || '');
          setRestaurantAddress(rest.address || '');
          setRestaurantDeliveryTime(rest.deliveryTime || '');
          setRestaurantImage(rest.image || '');
          setRestaurantIsOpen(rest.isOpen !== false);
          setRestaurantCuisine(Array.isArray(rest.cuisine) ? rest.cuisine.join(', ') : rest.cuisine || '');
          setRestaurantOfferPercentage(rest.offerPercentage || 0);
          setRestaurantType(rest.restaurantType || 'Multi Cuisine');
        }
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
      }
    };
    fetchRestaurant();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    // Save defaults to localStorage so they persist across reloads
    localStorage.setItem('cms_delivery_fee', deliveryFee.toString());
    localStorage.setItem('cms_tax_rate', taxRate.toString());
    localStorage.setItem('cms_currency', currency);
    localStorage.setItem('cms_unit', unit);
    localStorage.setItem('cms_prep_time', prepTime.toString());

    // Save single restaurant details to backend
    const cuisinesArray = restaurantCuisine.split(',').map(c => c.trim()).filter(Boolean);
    const payload = {
      name: restaurantName,
      address: restaurantAddress,
      deliveryTime: restaurantDeliveryTime,
      image: restaurantImage,
      isOpen: restaurantIsOpen,
      cuisine: cuisinesArray,
      offerPercentage: Number(restaurantOfferPercentage),
      restaurantType: restaurantType
    };

    try {
      await fetch(`${API_BASE_URL}/admin/restaurant`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Error updating restaurant details:', err);
    }

    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 max-w-3xl">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
            
            {/* Part 1: Global Settings */}
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-150 pb-4 mb-6 flex items-center gap-1.5">
              <SettingsIcon className="w-5 h-5 text-indigo-500 animate-spin-slow" /> Global Catalog Parameters
            </h3>

            <form onSubmit={handleSave} className="space-y-6 text-xs text-gray-700">
              
              {/* Delivery charges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Default Delivery Fee ({currency})</label>
                  <input 
                    type="number"
                    required
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                  />
                  <span className="text-[9px] text-gray-400 mt-1 block">Standard delivery charge applied if not overridden by promotional coupons.</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Catalog GST/VAT Tax Rate (%)</label>
                  <input 
                    type="number"
                    required
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                  />
                  <span className="text-[9px] text-gray-400 mt-1 block">Default value applied to calculate net items billing on cart checkout.</span>
                </div>
              </div>

              {/* Currency & units */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Currency Display Symbol</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 font-bold"
                  >
                    <option value="₹">₹ (INR Rupee)</option>
                    <option value="$">$ (USD Dollar)</option>
                    <option value="€">€ (Euro)</option>
                    <option value="£">£ (Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Default Serving Units</label>
                  <select 
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 font-bold"
                  >
                    <option value="Servings">Servings (e.g. 1 Person, 2 People)</option>
                    <option value="Grams">Grams (e.g. 250g, 500g)</option>
                    <option value="Pieces">Pieces (e.g. 4 Pcs, 6 Pcs)</option>
                  </select>
                </div>
              </div>

              {/* Default prep time */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Default Preparation Time (Minutes)</label>
                <input 
                  type="number"
                  required
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                />
              </div>

              {/* Part 2: Restaurant Settings */}
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-150 pb-4 mb-6 pt-4 flex items-center gap-1.5">
                <Store className="w-5 h-5 text-indigo-500" /> Restaurant Profile Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Restaurant Name</label>
                  <input 
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Image / Banner URL</label>
                  <input 
                    type="text"
                    required
                    value={restaurantImage}
                    onChange={(e) => setRestaurantImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Delivery Time Range</label>
                  <input 
                    type="text"
                    required
                    value={restaurantDeliveryTime}
                    onChange={(e) => setRestaurantDeliveryTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Timings / Status</label>
                  <select 
                    value={restaurantIsOpen ? 'open' : 'closed'}
                    onChange={(e) => setRestaurantIsOpen(e.target.value === 'open')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 font-bold"
                  >
                    <option value="open">Open (Accepting Orders)</option>
                    <option value="closed">Closed (No Deliveries)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Address</label>
                <input 
                  type="text"
                  required
                  value={restaurantAddress}
                  onChange={(e) => setRestaurantAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Cuisines (Comma Separated)</label>
                  <input 
                    type="text"
                    required
                    value={restaurantCuisine}
                    onChange={(e) => setRestaurantCuisine(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Default Discount Offer (%)</label>
                  <input 
                    type="number"
                    required
                    value={restaurantOfferPercentage}
                    onChange={(e) => setRestaurantOfferPercentage(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-gray-150 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Single Restaurant Notice</span>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                    Changing the restaurant profile details updates timings, name, banner, and address for all menus, and shows instantly to all customers on the mobile app.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-4 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:bg-emerald-600"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Configuration Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Catalog & Profile Settings</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
