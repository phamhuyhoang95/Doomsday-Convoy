import { useState } from 'react';
import { campaignDefinition } from '../content/campaign';
import type { GameCommand } from '../core/commands';
import { processCommand } from '../core/processor';
import { createGame } from '../core/state';
import type { GameState } from '../core/state-schema';
import { LocalSaveStore } from '../persistence/local-storage';

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [message, setMessage] = useState('');
  const store = (): LocalSaveStore => new LocalSaveStore(window.localStorage, campaignDefinition);
  const safely = (operation: () => void): void => { try { operation(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể thực hiện thao tác.'); } };
  const start = (seed: number): void => safely(() => {
    const next = createGame(seed, campaignDefinition); setState(next); setMessage('Đoàn xe đã sẵn sàng. Mỗi hành động tiêu thời gian và khẩu phần.');
    try { store().save('autosave', next); } catch { setMessage('Đã bắt đầu. Không ghi được autosave; hãy kiểm tra bộ nhớ trình duyệt.'); }
  });
  const dispatch = (payload: GameCommand['payload']): void => {
    if (!state) return;
    const result = processCommand(state, { id: `command.${state.commandLog.length + 1}`, issuerId: state.player.id, payload }, { principalId: state.player.id }, campaignDefinition);
    if (!result.ok) { setMessage(result.error.message); return; }
    setState(result.state); setMessage('');
    try { store().save('autosave', result.state); }
    catch { setMessage('Hành động đã thực hiện nhưng autosave không ghi được.'); }
  };
  const save = (): void => safely(() => { if (state) { store().save('manual', state); setMessage('Đã lưu vào slot thủ công trên trình duyệt này.'); } });
  const load = (slot = 'manual'): void => safely(() => { const next = store().load(slot); setState(next); setMessage('Đã tải game và xác minh lịch sử hành động.'); });
  return { state, message, start, dispatch, save, load, menu: () => setState(null), dismiss: () => setMessage('') };
}
