import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getFavoriteListings,
  getFavoriteRoommateProfiles,
  toggleListingFavorite,
  toggleRoommateFavorite,
} from '../services/favoriteService';
import ListingCard from '../components/ListingCard';
import RoommateCard from '../components/RoommateCard';
import { useHistoryState } from '../hooks/useHistoryState';

export default function Favorites() {
  const [tab, setTab] = useHistoryState('favorites-tab', 'listings');
  const [listings, setListings] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getFavoriteListings(), getFavoriteRoommateProfiles()])
      .then(([l, p]) => {
        setListings(l);
        setProfiles(p);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleListing(id) {
    setListings((prev) => prev.filter((l) => l.id !== id));
    await toggleListingFavorite(id);
  }

  async function handleToggleProfile(id) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    await toggleRoommateFavorite(id);
  }

  const tabs = [
    { value: 'listings', label: 'Phòng trọ', count: listings.length },
    { value: 'roommates', label: 'Hồ sơ ở ghép', count: profiles.length },
  ];
  const activeCount = tab === 'listings' ? listings.length : profiles.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="page-title">Đã lưu</h1>
      <p className="mt-1 text-gray-600">Phòng và hồ sơ bạn đã bấm lưu để xem lại sau.</p>

      <div role="tablist" className="mt-6 flex gap-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
              tab === t.value ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label} <span className="font-normal text-gray-500">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
            ))}
          </div>
        )}

        {!loading && activeCount === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <p className="font-semibold text-gray-900">
              {tab === 'listings' ? 'Bạn chưa lưu phòng nào' : 'Bạn chưa lưu hồ sơ nào'}
            </p>
            <p className="mt-1 text-sm text-gray-600">Bấm biểu tượng trái tim trên mỗi tin để lưu lại.</p>
            <Link to={tab === 'listings' ? '/search' : '/roommates'} className="btn-secondary mt-5">
              {tab === 'listings' ? 'Tìm phòng' : 'Xem hồ sơ ở ghép'}
            </Link>
          </div>
        )}

        {!loading && tab === 'listings' && listings.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                favorited
                onToggleFavorite={() => handleToggleListing(listing.id)}
              />
            ))}
          </div>
        )}

        {!loading && tab === 'roommates' && profiles.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((profile) => (
              <RoommateCard
                key={profile.id}
                profile={profile}
                favorited
                onToggleFavorite={() => handleToggleProfile(profile.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
