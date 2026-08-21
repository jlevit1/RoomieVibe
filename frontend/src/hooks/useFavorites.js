import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getFavoriteListingIds,
  toggleListingFavorite,
  getFavoriteRoommateProfileIds,
  toggleRoommateFavorite,
} from '../services/favoriteService';

const FETCHERS = {
  listing: getFavoriteListingIds,
  roommate: getFavoriteRoommateProfileIds,
};

const TOGGLERS = {
  listing: toggleListingFavorite,
  roommate: toggleRoommateFavorite,
};

export function useFavorites(type) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    FETCHERS[type]()
      .then((list) => setIds(new Set(list)))
      .catch(() => {});
  }, [user, type]);

  const isFavorited = useCallback((id) => ids.has(id), [ids]);

  const toggle = useCallback(
    async (id) => {
      if (!user) {
        navigate('/login');
        return;
      }
      const { favorited } = await TOGGLERS[type](id);
      setIds((prev) => {
        const next = new Set(prev);
        if (favorited) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [user, type, navigate]
  );

  return { isFavorited, toggle };
}
