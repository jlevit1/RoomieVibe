// Du lieu trang tri tam thoi (chua co API that) - se thay bang du lieu that
// khi tinh nang danh gia (reviews) va yeu thich (favorites) duoc lam o backend.

export function getMockRating(id) {
  const seed = Number(id) || 0;
  const rating = 4.0 + ((seed * 37) % 10) / 10; // 4.0 - 4.9
  const count = 3 + ((seed * 13) % 40); // 3 - 42
  return { rating: rating.toFixed(1), count };
}
