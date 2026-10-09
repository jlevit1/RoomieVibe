// Scripted browser walkthrough of RoomieVibe's main features, for screen recording.
// Runs a real, visible Chromium window and drives it step by step with pauses so
// the recording reads naturally - it is not a pass/fail test suite.
//
// Prereqs:
//   - Backend running on http://localhost:8080
//   - Frontend dev server running on http://localhost:5173 (npm run dev)
//   - Seed data present (DataSeeder runs automatically unless app.seed.enabled=false)
//
// Run all scenes:        node e2e/demo.mjs
// Run only some scenes:  node e2e/demo.mjs 1 2 3 6
// Slow everything down:  node e2e/demo.mjs --speed=1.6 1 2 3 6   (default speed = 1)

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const RENTER = { email: 'seed.roommate1@roomievibe.local', password: '123456' };
const LANDLORD = { email: 'seed.landlord1@roomievibe.local', password: '123456' };

const args = process.argv.slice(2);
const speedArg = args.find((a) => a.startsWith('--speed='));
const SPEED = speedArg ? Number.parseFloat(speedArg.split('=')[1]) : 1;
const selectedIds = args.filter((a) => !a.startsWith('--')).map(Number).filter((n) => !Number.isNaN(n));

function pause(ms = 1200) {
  return new Promise((resolve) => setTimeout(resolve, Math.round(ms * SPEED)));
}

async function runScene(id, name, fn) {
  console.log(`\n=== ${id}. ${name} ===`);
  try {
    await fn();
  } catch (err) {
    console.log(`   (bỏ qua bước này - không tìm thấy phần tử mong đợi: ${String(err.message).split('\n')[0]})`);
  }
}

async function logout(page) {
  // The avatar button's inner span is styled bg-rose-600 - distinct from the
  // notification bell's unread-badge span (bg-red-500), which also matches
  // rounded-full and would otherwise be ambiguous.
  const avatarButton = page.locator('nav button:has(span.bg-rose-600)').first();
  if (await avatarButton.count() === 0) return;
  await avatarButton.click();
  await pause(500);
  const logoutBtn = page.getByRole('button', { name: 'Đăng xuất' });
  if (await logoutBtn.count() > 0) {
    await logoutBtn.click();
    await pause(1000);
  }
}

async function openFirstListing(page) {
  await page.goto(BASE_URL + '/search');
  await pause(1000);
  const listView = page.getByRole('button', { name: /Danh sách/ });
  if (await listView.count() > 0) {
    await listView.click();
    await pause(600);
  }
  await page.locator('a[href^="/listings/"]').first().click();
  await pause(1500);
}

const scenes = [
  {
    id: 1,
    name: 'Trang chủ',
    run: async (page) => {
      await page.goto(BASE_URL);
      await pause(1800);
      await page.mouse.wheel(0, 700);
      await pause(1200);
      await page.mouse.wheel(0, 700);
      await pause(1500);
      await page.mouse.wheel(0, 700);
      await pause(1200);
    },
  },
  {
    id: 2,
    name: 'Đăng nhập (người thuê)',
    run: async (page) => {
      await page.goto(BASE_URL + '/login');
      await pause(800);
      await page.locator('#login-email').fill(RENTER.email);
      await pause(300);
      await page.locator('#login-password').fill(RENTER.password);
      await pause(300);
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
      await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
      await pause(1200);
    },
  },
  {
    id: 3,
    name: 'Tìm kiếm & lọc phòng trọ',
    run: async (page) => {
      await page.goto(BASE_URL + '/search');
      await pause(1200);
      await page.locator('#filter-city').fill('Hà Nội');
      await pause(500);
      await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click();
      await pause(1800);
    },
  },
  {
    id: 4,
    name: 'Bản đồ nhiệt giá thuê',
    run: async (page) => {
      const heatmapBtn = page.getByRole('button', { name: /Bản đồ giá/ });
      if (await heatmapBtn.count() === 0) {
        await page.goto(BASE_URL + '/search');
        await pause(1000);
      }
      await page.getByRole('button', { name: /Bản đồ giá/ }).click();
      await pause(3000);
    },
  },
  {
    id: 5,
    name: 'Xem chi tiết tin đăng & lưu yêu thích',
    run: async (page) => {
      await openFirstListing(page);
      const favoriteBtn = page.getByRole('button', { name: /lưu tin yêu thích/i });
      if (await favoriteBtn.count() > 0) {
        await favoriteBtn.click();
        await pause(1000);
      }
    },
  },
  {
    id: 6,
    name: 'Nhắn tin cho chủ nhà',
    run: async (page) => {
      let messageBtn = page.getByRole('button', { name: 'Nhắn tin' });
      if (await messageBtn.count() === 0) {
        await openFirstListing(page);
        messageBtn = page.getByRole('button', { name: 'Nhắn tin' });
      }
      if (await messageBtn.count() > 0) {
        await messageBtn.click();
        await page.waitForURL('**/messages/**', { timeout: 10000 });
        await pause(1500);
        const input = page.getByPlaceholder('Nhập tin nhắn...');
        await input.fill('Chào anh/chị, phòng này còn không ạ?');
        await pause(500);
        await page.keyboard.press('Enter');
        await pause(1500);
      }
    },
  },
  {
    id: 7,
    name: 'Chuông thông báo',
    run: async (page) => {
      await page.goto(BASE_URL);
      await pause(1000);
      await page.locator('button[title="Thông báo"]').click();
      await pause(2500);
    },
  },
  {
    id: 8,
    name: 'Gợi ý "Có thể bạn quan tâm"',
    run: async (page) => {
      await page.goto(BASE_URL);
      await pause(1500);
      await page.mouse.wheel(0, 1600);
      await pause(2200);
    },
  },
  {
    id: 9,
    name: 'Đăng xuất, đăng nhập chủ nhà',
    run: async (page) => {
      await logout(page);
      await page.goto(BASE_URL + '/login');
      await pause(800);
      await page.locator('#login-email').fill(LANDLORD.email);
      await pause(300);
      await page.locator('#login-password').fill(LANDLORD.password);
      await pause(300);
      await page.getByRole('button', { name: 'Đăng nhập' }).click();
      await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
      await pause(1200);
    },
  },
  {
    id: 10,
    name: 'Tin của tôi (chủ nhà)',
    run: async (page) => {
      await page.goto(BASE_URL + '/listings/mine');
      await pause(2000);
    },
  },
];

const toRun = selectedIds.length > 0 ? scenes.filter((s) => selectedIds.includes(s.id)) : scenes;

console.log(`Chạy ${toRun.length}/${scenes.length} cảnh, tốc độ x${SPEED}...`);

const browser = await chromium.launch({ headless: false, slowMo: Math.round(350 * SPEED) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

for (const s of toRun) {
  await runScene(s.id, s.name, () => s.run(page));
}

console.log('\nDemo hoàn tất. Cửa sổ trình duyệt sẽ tự đóng sau vài giây.');
await pause(3000);
await browser.close();
