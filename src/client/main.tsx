import { createRoot } from 'react-dom/client';
import './style.css';

function FoundationPage() {
  return <main>
    <p className="eyebrow">LAST CONVOY · ENGINE FOUNDATION</p>
    <h1>Đoàn xe đã sẵn sàng<br />cho hành trình đầu tiên.</h1>
    <p>Phase 1 chạy bằng game engine headless. Giao diện chơi sẽ được triển khai trong Phase 4.</p>
    <section aria-label="Chạy game engine">
      <h2>Chạy hành trình</h2>
      <code>npm run demo -- --seed 42 --path direct</code>
      <p>8 địa điểm · 11 tuyến · 3 nhân vật · RNG có seed · Save/load · Replay</p>
    </section>
    <p className="secondary">Đây là trang xác nhận nền tảng React + Vite. Xem README để chạy và kiểm thử lõi game.</p>
  </main>;
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');
createRoot(root).render(<FoundationPage />);
