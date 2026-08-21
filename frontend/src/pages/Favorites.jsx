import { useEffect, useState } from 'react';
import { Heart, Home as HomeIcon, Users } from 'lucide-react';
import {
  getFavoriteListings,
  getFavoriteRoommateProfiles,
  toggleListingFavorite,
  toggleRoommateFavorite,
} from '../services/favoriteService';
import ListingCard from '../components/ListingCard';
import RoommateCard from '../components/RoommateCard';

export default function Favorites() {
  const [tab, setTab] = useState('listings');
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

  const activeCount = tab === 'listings' ? listings.length : profiles.length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Đã lưu</h1>
      <p className="mb-6 text-sm text-gray-500">Các tin phòng trọ và hồ sơ bạn đã đánh dấu yêu thích.</p>

      <div className="mb-6 inline-flex rounded-full border border-gray-200 p-1">
        <button
          type="button"
          onClick={() => setTab('listings')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'listings' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:text-rose-600'
          }`}
        >
          <HomeIcon size={15} /> Phòng trọ ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('roommates')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'roommates' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:text-rose-600'
          }`}
        >
          <Users size={15} /> Tìm bạn ở ghép ({profiles.length})
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-gray-200">
              <div className="h-40 bg-gray-100" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="h-3 w-3/4 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeCount === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <Heart size={28} className="text-gray-300" />
          <p className="text-gray-500">
            {tab === 'listings' ? 'Bạn chưa lưu tin phòng trọ nào.' : 'Bạn chưa lưu hồ sơ nào.'}
          </p>
        </div>
      )}

      {!loading && tab === 'listings' && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
