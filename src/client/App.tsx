import { useState } from 'react';
import { campaignDefinition as definition } from '../content/campaign';
import { RESOURCE_IDS } from '../core/primitives';
import type { GameState } from '../core/state-schema';
import { CombatPanel } from './components/CombatPanel';
import { Convoy, Inventory } from './components/Convoy';
import { EventPanel } from './components/EventPanel';
import { DebugPanel, Journal } from './components/Journal';
import { Meter, resourceLabels, resourceSymbols } from './components/shared';
import { WorldMap } from './components/WorldMap';
import { useGame } from './use-game';

function Brand() { return <div className="brand"><span className="brand-mark">LC<span>↗</span></span><span>LAST CONVOY<small>CHUYẾN XE CUỐI CÙNG</small></span></div>; }
function MainMenu({ start, load }: { start: (seed: number) => void; load: (slot?: string) => void }) {
  const [seed, setSeed] = useState('42'); const [error, setError] = useState('');
  return <div className="menu-shell"><header><Brand/><span className="badge">MVP v0.1</span></header><main className="menu-main">
    <div className="menu-copy"><p className="eyebrow">CHIẾN THUẬT · SINH TỒN · QUỶ DỊ</p><h1>Phía trước<br/>vẫn còn <em>đường.</em></h1>
      <p className="menu-description">Thành phố đã tắt đèn. Tiếng gọi vẫn vọng ra từ bệnh viện. Bạn còn một đoàn xe, ba người sống sót và một cơ hội tới Bắc Sơn.</p>
      <form onSubmit={(event) => { event.preventDefault(); const value = Number(seed); if (!/^\d+$/.test(seed) || !Number.isInteger(value) || value < 0 || value > 0xffff_ffff) { setError('Seed cần là số nguyên từ 0 đến 4294967295.'); return; } setError(''); start(value); }}>
        <label className="seed-label" htmlFor="seed">MÃ HÀNH TRÌNH <span>Cùng seed, cùng hành động, cùng kết quả.</span></label>
        <div className="seed-row"><input id="seed" inputMode="numeric" value={seed} onChange={(event) => setSeed(event.target.value)} aria-describedby={error ? 'seed-error' : undefined}/><button className="button primary" type="submit">Bắt đầu hành trình <span>↗</span></button></div>
        {error && <p id="seed-error" className="error" role="alert">{error}</p>}
      </form>
      <div className="menu-secondary"><button className="text-button" onClick={() => load('autosave')}>↳ Tiếp tục autosave</button><button className="text-button" onClick={() => load('manual')}>Tải bản lưu thủ công</button></div>
      <div className="menu-guidance"><span>01 · RỜI THÀNH PHỐ</span><span>02 · BỆNH VIỆN</span><span>03 · CUỘC TRANH ĐOẠT</span></div>
    </div>
    <div className="menu-illustration" aria-label="Một đoàn xe giữa thành phố bỏ hoang" role="img"><div className="menu-sun"/><div className="towers back"/><div className="towers front"/><div className="menu-highway"/><div className="hero-bus"><div className="bus-windows"/><span>07</span><i/><i/></div><div className="headlight"/><p>VĨ ĐỘ 21° N<br/>TÍN HIỆU CUỐI: BẮC SƠN</p></div>
  </main><footer>GIỮ NGƯỜI SỐNG. GIỮ XE CHẠY. GIỮ IM LẶNG KHI CHUÔNG REO.</footer></div>;
}

function Ending({ state }: { state: GameState }) {
  const convoy = state.convoys[state.player.convoyId];
  const survivors = convoy?.actorIds.filter((id) => state.actors[id]?.status !== 'dead').length ?? 0;
  return <section className={`panel ending-panel ${state.status === 'lost' ? 'defeat' : ''}`}><p className="eyebrow">HÀNH TRÌNH ĐÃ KẾT THÚC</p><h1>{state.status === 'won' ? 'Bình minh ở Bắc Sơn.' : 'Một khoảng lặng cuối cùng.'}</h1>
    <p>{state.status === 'won' ? 'Cánh cửa hầm trú đã mở. Những gì bạn cứu được và những gì bạn bỏ lại sẽ đi cùng đoàn.' : state.ending?.kind === 'defeat' ? ({ 'vehicle-destroyed': 'Chiếc xe đã không thể đi thêm. Đoàn mất cơ hội tới nơi trú.', 'supplies-exhausted': 'Khẩu phần cạn trước khi đoàn tới nơi an toàn.', 'no-active-crew': 'Không còn ai đủ sức dẫn đoàn đi tiếp.' }[state.ending.reason]) : 'Hành trình đã dừng lại.'}</p>
    <div className="ending-stats"><div><strong>{survivors}</strong><span>Người sống sót</span></div><div><strong>{state.world.tick}h</strong><span>Thời gian thế giới</span></div><div><strong>{Object.values(state.inventory.artifactInstances).filter((entry) => entry.ownerId === state.player.convoyId).length}</strong><span>Kỳ vật giữ được</span></div><div><strong>{convoy?.vehicle.condition ?? 0}%</strong><span>Tình trạng xe</span></div></div>
    <p className="muted">Bạn có thể xem lại nhật ký, lưu kết cục, hoặc về menu để bắt đầu một hành trình khác.</p>
  </section>;
}

function RecentLog({ state }: { state: GameState }) {
  const rows = state.commandLog.flatMap((record) => record.events.flatMap((event) => {
    const payload = event.payload;
    if (payload.type === 'event.resolved') return [{ id: event.id, tick: event.tick, text: definition.campaign?.texts[payload.outcomeKey] ?? payload.eventId }];
    if (payload.type === 'convoy.moved') return [{ id: event.id, tick: event.tick, text: `Đã tới ${definition.locations.find((entry) => entry.id === payload.to)?.name ?? payload.to}.` }];
    if (payload.type === 'travel.hazard') return [{ id: event.id, tick: event.tick, text: `Chướng ngại trên đường. Xe hư hại ${payload.damage}.` }];
    return [];
  })).slice(-4).reverse();
  return <section className="panel recent-log"><p className="eyebrow">NHẬT KÝ HÀNH TRÌNH</p>{rows.length ? rows.map((row) => <p key={row.id}><time>T{String(row.tick).padStart(2, '0')}</time><span>{row.text}</span></p>) : <p className="muted">Động cơ vẫn còn ấm. Hành trình bắt đầu từ lựa chọn của bạn.</p>}</section>;
}

export default function App() {
  const game = useGame(); const [tab, setTab] = useState('map'); const state = game.state;
  const toast = game.message && <div className="toast" role="status"><span>{game.message}</span><button className="text-button" aria-label="Đóng thông báo" onClick={game.dismiss}>×</button></div>;
  if (!state) return <><MainMenu start={(seed) => { setTab('map'); game.start(seed); }} load={game.load}/>{toast}</>;
  const convoy = state.convoys[state.player.convoyId]; if (!convoy) return null;
  const location = definition.locations.find((entry) => entry.id === convoy.locationId); const region = definition.regions.find((entry) => entry.id === location?.regionId);
  const day = Math.floor(state.world.tick / 24) + 1; const hour = state.world.tick % 24;
  const alive = convoy.actorIds.filter((id) => state.actors[id]?.status !== 'dead').length;
  return <div className="game-shell"><header className="topbar"><Brand/><div className="world-clock"><span className="signal-dot"/>NGÀY {String(day).padStart(2, '0')}<strong>{String(hour).padStart(2, '0')}:00</strong></div><div className="save-controls"><button className="button subtle" onClick={game.save}>Lưu game</button><button className="button subtle" onClick={() => game.load()}>Tải game</button><button className="button subtle" onClick={game.menu}>Menu</button></div></header>
    <div className="resource-bar">{RESOURCE_IDS.map((id) => <div className={`resource ${convoy.resources[id] < 6 ? 'low' : ''}`} key={id}><span className="resource-icon">{resourceSymbols[id]}</span><span><small>{resourceLabels[id]}</small><strong>{convoy.resources[id]}</strong></span></div>)}<div className="vehicle-status"><Meter label={convoy.vehicle.name} value={convoy.vehicle.condition} max={convoy.vehicle.maxCondition} danger={convoy.vehicle.condition < 30}/></div><div className="crew-count"><strong>{alive}</strong><small>NGƯỜI SỐNG</small></div></div>
    <main className="game-main"><div className="location-heading"><div><p className="eyebrow">{region?.name} / HÀNH TRÌNH #{state.initialSeed}</p><h1>{state.combat ? 'Không còn đường lùi dễ dàng.' : state.status !== 'active' ? 'Câu chuyện của đoàn.' : location?.name}</h1></div><span className="chapter-chip">{location?.regionId === 'region.city' ? 'MÀN 01' : location?.regionId === 'region.hospital' ? 'MÀN 02' : 'MÀN 03'}<span>●</span></span></div>
      <nav className="tabs" aria-label="Màn hình game">{[['map', 'Bản đồ hành trình'], ['crew', 'Đoàn xe'], ['inventory', 'Kho đồ'], ['journal', 'Nhiệm vụ & manh mối'], ['debug', 'Chẩn đoán']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id ?? 'map')}>{label}</button>)}</nav>
      {tab === 'map' ? <>{state.status !== 'active' ? <Ending state={state}/> : state.combat ? <CombatPanel state={state} dispatch={game.dispatch}/> : <div className="main-grid"><WorldMap state={state} dispatch={game.dispatch}/><EventPanel state={state} dispatch={game.dispatch}/></div>}
        <div className="below-map"><RecentLog state={state}/><section className="panel action-panel"><p className="eyebrow">QUYỀN CHỈ HUY</p><h3>Mỗi giờ đều có giá.</h3><p className="muted">{alive} người đang cần khẩu phần. Chờ đợi cũng cho đối thủ thời gian hành động.</p><div><button className="button" disabled={state.status !== 'active' || Boolean(state.combat)} onClick={() => game.dispatch({ type: 'wait', convoyId: convoy.id, ticks: 1 })}>Chờ 1 giờ</button><button className="button" disabled={state.status !== 'active' || Boolean(state.combat)} onClick={() => game.dispatch({ type: 'investigate', convoyId: convoy.id })}>Trinh sát · 1 giờ</button></div></section></div></>
        : tab === 'crew' ? <Convoy state={state} dispatch={game.dispatch}/> : tab === 'inventory' ? <Inventory state={state}/> : tab === 'journal' ? <Journal state={state}/> : <DebugPanel state={state}/>}
    </main><footer className="game-footer"><span>LAST CONVOY / MVP 0.1</span><span>MỘT CHUYẾN XE. MỌI QUYẾT ĐỊNH ĐỀU CÓ HẬU QUẢ.</span><span>SEED {state.initialSeed}</span></footer>{toast}
  </div>;
}
