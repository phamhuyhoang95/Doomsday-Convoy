import { useState } from 'react';
import { campaignDefinition as definition } from '../../content/campaign';
import { currentCombatActor } from '../../combat/engine';
import type { GameCommand } from '../../core/commands';
import type { GameState } from '../../core/state-schema';
import { evaluateCondition } from '../../narrative/conditions';
import { Meter, statusLabels } from './shared';

export function CombatPanel({ state, dispatch }: { state: GameState; dispatch: (payload: GameCommand['payload']) => void }) {
  const [targetId, setTargetId] = useState('');
  const combat = state.combat; const current = currentCombatActor(state);
  if (!combat || !current) return null;
  const allies = Object.values(state.actors).filter((actor) => actor.convoyId === state.player.convoyId);
  const enemies = Object.values(state.actors).filter((actor) => actor.convoyId === combat.enemyConvoyId);
  const activeTarget = enemies.find((actor) => actor.id === targetId && actor.status === 'active') ?? enemies.find((actor) => actor.status === 'active');
  const action = (type: Extract<GameCommand['payload'], { type: 'combat' }>['action'], target?: string) => dispatch({ type: 'combat', convoyId: state.player.convoyId, actorId: current.id, action: type, ...(target ? { targetId: target } : {}) });
  const peaceful = definition.campaign?.rival && evaluateCondition(state, definition.campaign.rival.negotiationCondition);
  return <section className="panel combat-panel">
    <div className="panel-heading"><div><p className="eyebrow">ĐỐI ĐẦU / ĐOÀN TRO TÀN</p><h2>{combat.phase === 'aftermath' ? 'Đối thủ đã gục ngã' : `Vòng ${combat.round} · Lượt của ${current.name}`}</h2></div><span className="badge danger">CHIẾN ĐẤU</span></div>
    <div className="battlefield">
      <div className="team"><p className="eyebrow">ĐOÀN CỦA BẠN</p>{allies.map((actor) => <div className={`fighter ${actor.id === current.id ? 'acting' : ''} ${actor.status !== 'active' ? 'incapacitated' : ''}`} key={actor.id}>
        <div className="fighter-heading"><span className="portrait">{actor.name[0]}</span><div><strong>{actor.name}</strong><small>{actor.role} · {statusLabels[actor.status]}</small></div></div>
        <Meter value={actor.health} max={actor.maxHealth} label="HP" danger={actor.health < actor.maxHealth / 3}/>
        <small>Năng lượng {actor.energy ?? 0} / {actor.attributes?.maxEnergy ?? 0}{combat.defendedActorIds.includes(actor.id) ? ' · Phòng thủ' : ''}</small>
      </div>)}</div>
      <span className="versus">VS</span>
      <div className="team"><p className="eyebrow">TRO TÀN · CHỌN MỤC TIÊU</p>{enemies.map((actor) => <button className={`fighter target ${activeTarget?.id === actor.id ? 'selected' : ''} ${actor.status !== 'active' ? 'incapacitated' : ''}`} key={actor.id}
        disabled={actor.status !== 'active' && combat.phase !== 'aftermath'} onClick={() => setTargetId(actor.id)} aria-label={`Chọn ${actor.name}`}>
        <div className="fighter-heading"><span className="portrait enemy">{actor.name[0]}</span><div><strong>{actor.name}</strong><small>{actor.role} · {statusLabels[actor.status]}</small></div></div>
        <Meter value={actor.health} max={actor.maxHealth} label="HP" danger/>
      </button>)}</div>
    </div>
    <div className="battle-actions">{combat.phase === 'aftermath' ? <>
      {enemies.filter((actor) => actor.status === 'downed').map((actor) => <button className="button" key={actor.id} onClick={() => action('capture', actor.id)}>Bắt giữ {actor.name}</button>)}
      <button className="button primary" onClick={() => action('finish')}>Kết thúc trận · Bỏ lại người chưa bắt</button>
    </> : <>
      <button className="button primary" disabled={!activeTarget} onClick={() => action('attack', activeTarget?.id)}>Tấn công {activeTarget?.name}</button>
      <button className="button" onClick={() => action('defend')}>Phòng thủ</button>
      {(current.skillIds ?? []).map((id) => {
        const skill = definition.campaign?.skills.find((entry) => entry.id === id); if (!skill || skill.target === 'exploration') return null;
        const disabled = (current.energy ?? 0) < skill.energyCost || (current.cooldowns?.[id] ?? 0) > state.world.tick + 1;
        const ally = [...allies].filter((actor) => actor.status !== 'dead' && actor.status !== 'captured').sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth)[0];
        const target = skill.target === 'enemy' ? activeTarget?.id : skill.target === 'ally' ? ally?.id : current.id;
        return <button className="button skill-button" key={id} title={skill.description} disabled={disabled || !target} onClick={() => dispatch({ type: 'use-skill', convoyId: state.player.convoyId, actorId: current.id, skillId: id, ...(target ? { targetId: target } : {}) })}>{skill.name} · {skill.energyCost} NL{skill.target === 'ally' && ally ? ` → ${ally.name}` : ''}</button>;
      })}
      {enemies.filter((actor) => actor.status === 'downed').map((actor) => <button className="button" key={actor.id} onClick={() => action('capture', actor.id)}>Bắt giữ {actor.name}</button>)}
      <button className="button" disabled={!peaceful} onClick={() => action('negotiate')}>Đàm phán</button>
      <button className="button" disabled={(state.convoys[state.player.convoyId]?.resources.fuel ?? 0) < 2} onClick={() => action('retreat')}>Rút lui · 2 nhiên liệu · 80%</button>
      <button className="button danger-button" onClick={() => action('surrender')}>Đầu hàng · Giao kỳ vật</button>
    </>}</div>
    <div className="combat-log" aria-live="polite">{combat.log.slice(-5).map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}</div>
    <p className="muted footnote">Mỗi hành động tiêu 1 giờ và khẩu phần. Kết thúc trận sẽ bỏ lại người chưa bắt; họ không còn sống sót.</p>
  </section>;
}
