/*
 * ─────────────────────────────────────────────────────────────
 * SQL — run in Supabase SQL Editor before using this tab:
 * ─────────────────────────────────────────────────────────────
 *
 * create table if not exists team_selections (
 *   id              uuid primary key default gen_random_uuid(),
 *   match_id        uuid references matches(id) on delete cascade,
 *   player_id       uuid references players(id) on delete cascade,
 *   player_name     text not null,
 *   position        text not null default 'Player',
 *   batting_order   integer,
 *   bowling_order   integer,
 *   is_captain      boolean default false,
 *   is_vice_captain boolean default false,
 *   is_wicketkeeper boolean default false,
 *   is_reserve      boolean default false,
 *   created_at      timestamptz default now(),
 *   unique(match_id, player_id)
 * );
 *
 * alter table team_selections enable row level security;
 *
 * create policy "public read team_selections"
 *   on team_selections for select using (true);
 * create policy "public insert team_selections"
 *   on team_selections for insert with check (true);
 * create policy "public update team_selections"
 *   on team_selections for update using (true);
 * create policy "public delete team_selections"
 *   on team_selections for delete using (true);
 *
 * alter table matches
 *   add column if not exists is_team_published boolean default false;
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { C, FONT } from '../../constants'
const AC = { green:'#2563eb', greenDark:'#1e3a8a', greenLight:'#1d4ed8', greenBg:'#eff6ff', gold:'#e9a020', white:'#ffffff', bg:'#eef2ff', gray1:'#f1f5f9', gray2:'#e2e8f0', gray3:'#94a3b8', gray4:'#64748b', gray5:'#334155', dark:'#0f172a', red:'#dc2626', redBg:'#fee2e2', ok:'#16a34a', okBg:'#dcfce7', blue:'#2563eb', blueBg:'#eff6ff', shadow:'rgba(30,58,138,0.07)', shadowMd:'rgba(30,58,138,0.11)', shadowLg:'rgba(30,58,138,0.18)' } // admin keeps original light theme
import { useToast } from '../Toast'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

const POSITIONS = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']

const ROLE_STYLE = {
  Batsman:        { bg: '#eff6ff', color: '#2563eb' },
  Bowler:         { bg: '#fef2f2', color: '#dc2626' },
  'All-Rounder':  { bg: '#f5f3ff', color: '#7c3aed' },
  'Wicket-Keeper':{ bg: '#fffbeb', color: '#d97706' },
  Player:         { bg: AC.gray1,   color: AC.gray4   },
}

function roleShort(pos) {
  if (pos === 'All-Rounder')   return 'AR'
  if (pos === 'Wicket-Keeper') return 'WK'
  if (pos === 'Batsman')       return 'BAT'
  if (pos === 'Bowler')        return 'BOWL'
  return 'PLR'
}

function RolePill({ role, style: s }) {
  const rs = ROLE_STYLE[role] || ROLE_STYLE.Player
  return (
    <span
      style={{
        background: rs.bg,
        color: rs.color,
        padding: '2px 8px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        ...s,
      }}
    >
      {roleShort(role)}
    </span>
  )
}

function ToggleBtn({ active, color, bgActive, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 11px',
        borderRadius: 8,
        border: `1.5px solid ${active ? color : AC.gray2}`,
        background: active ? bgActive : AC.white,
        color: active ? color : AC.gray3,
        cursor: 'pointer',
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 12,
        transition: 'all .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TabTeamSelection() {
  const toast = useToast()
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [availablePlayers, setAvailablePlayers] = useState([])
  const [selection, setSelection] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishStatus, setPublishStatus] = useState('draft')

  useEffect(() => { init() }, [])

  async function init() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('date', { ascending: false })
    const ms = data || []
    setMatches(ms)
    const active = ms.find((m) => m.is_active) || ms[0] || null
    if (active) {
      setSelectedMatchId(active.id)
      await loadMatchData(active.id, active)
    } else {
      setLoading(false)
    }
  }

  async function loadMatchData(matchId, matchObj) {
    setLoading(true)
    setSelectedMatch(matchObj)
    setPublishStatus(matchObj?.is_team_published ? 'published' : 'draft')

    const [{ data: avail }, { data: ts }] = await Promise.all([
      supabase
        .from('availability')
        .select('*, players(*)')
        .eq('match_id', matchId)
        .eq('available', true),
      supabase
        .from('team_selections')
        .select('*')
        .eq('match_id', matchId)
        .order('batting_order', { ascending: true }),
    ])

    setAvailablePlayers((avail || []).map((a) => a.players).filter(Boolean))

    if (ts && ts.length > 0) {
      setSelection(
        ts.map((s) => ({
          player_id:      s.player_id,
          player_name:    s.player_name,
          position:       s.position || 'Batsman',
          is_captain:     !!s.is_captain,
          is_vice_captain:!!s.is_vice_captain,
          is_wicketkeeper:!!s.is_wicketkeeper,
          is_reserve:     !!s.is_reserve,
        }))
      )
    } else {
      setSelection([])
    }

    setLoading(false)
  }

  function handleMatchChange(e) {
    const id = e.target.value
    const m = matches.find((x) => x.id === id) || null
    setSelectedMatchId(id)
    loadMatchData(id, m)
  }

  const xi       = selection.filter((s) => !s.is_reserve)
  const reserves = selection.filter((s) =>  s.is_reserve)

  function isSelected(playerId) {
    return selection.some((s) => s.player_id === playerId)
  }

  function togglePlayer(player) {
    if (isSelected(player.id)) {
      setSelection((prev) => prev.filter((s) => s.player_id !== player.id))
    } else {
      setSelection((prev) => [
        ...prev,
        {
          player_id:      player.id,
          player_name:    player.name,
          position:       POSITIONS.includes(player.role) ? player.role : 'Batsman',
          is_captain:     false,
          is_vice_captain:false,
          is_wicketkeeper:player.role === 'Wicket-Keeper',
          is_reserve:     false,
        },
      ])
    }
  }

  function update(playerId, patch) {
    setSelection((prev) =>
      prev.map((s) => (s.player_id === playerId ? { ...s, ...patch } : s))
    )
  }

  function setCaptain(playerId) {
    const isCurrent = selection.find((s) => s.player_id === playerId)?.is_captain
    setSelection((prev) =>
      prev.map((s) => ({ ...s, is_captain: s.player_id === playerId ? !isCurrent : false }))
    )
  }

  function setViceCaptain(playerId) {
    const isCurrent = selection.find((s) => s.player_id === playerId)?.is_vice_captain
    setSelection((prev) =>
      prev.map((s) => ({ ...s, is_vice_captain: s.player_id === playerId ? !isCurrent : false }))
    )
  }

  function moveUp(playerId) {
    setSelection((prev) => {
      const main = prev.filter((s) => !s.is_reserve)
      const res  = prev.filter((s) =>  s.is_reserve)
      const i = main.findIndex((s) => s.player_id === playerId)
      if (i <= 0) return prev
      const next = [...main]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return [...next, ...res]
    })
  }

  function moveDown(playerId) {
    setSelection((prev) => {
      const main = prev.filter((s) => !s.is_reserve)
      const res  = prev.filter((s) =>  s.is_reserve)
      const i = main.findIndex((s) => s.player_id === playerId)
      if (i === -1 || i >= main.length - 1) return prev
      const next = [...main]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return [...next, ...res]
    })
  }

  async function saveSelection(andPublish = false) {
    if (!selectedMatchId) return
    setSaving(true)

    await supabase.from('team_selections').delete().eq('match_id', selectedMatchId)

    const rows = [
      ...xi.map((s, i) => ({
        match_id:       selectedMatchId,
        player_id:      s.player_id,
        player_name:    s.player_name,
        position:       s.position,
        batting_order:  i + 1,
        is_captain:     s.is_captain,
        is_vice_captain:s.is_vice_captain,
        is_wicketkeeper:s.is_wicketkeeper,
        is_reserve:     false,
      })),
      ...reserves.map((s, i) => ({
        match_id:       selectedMatchId,
        player_id:      s.player_id,
        player_name:    s.player_name,
        position:       s.position,
        batting_order:  100 + i,
        is_captain:     s.is_captain,
        is_vice_captain:s.is_vice_captain,
        is_wicketkeeper:s.is_wicketkeeper,
        is_reserve:     true,
      })),
    ]

    if (rows.length > 0) {
      const { error } = await supabase.from('team_selections').insert(rows)
      if (error) {
        toast(error.message || 'Failed to save', 'error')
        setSaving(false)
        return
      }
    }

    if (andPublish) {
      await supabase
        .from('matches')
        .update({ is_team_published: true })
        .eq('id', selectedMatchId)
      setPublishStatus('published')
      setSelectedMatch((m) => (m ? { ...m, is_team_published: true } : m))
      toast('Team published! Players can see the XI on the home page.', 'success')
    } else {
      toast('Draft saved.', 'success')
    }
    setSaving(false)
  }

  async function unpublish() {
    if (!selectedMatchId) return
    await supabase
      .from('matches')
      .update({ is_team_published: false })
      .eq('id', selectedMatchId)
    setPublishStatus('draft')
    setSelectedMatch((m) => (m ? { ...m, is_team_published: false } : m))
    toast('Team unpublished from home page.', 'success')
  }

  if (loading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: AC.gray3, fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', color: AC.gray3, padding: '24px 0', fontSize: 14 }}>
          No matches found. Create a match in the Match tab first.
        </div>
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Match selector */}
      {matches.length > 1 && (
        <Card style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: AC.gray4, marginBottom: 6 }}>Select Match</div>
          <select
            value={selectedMatchId || ''}
            onChange={handleMatchChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: `1.5px solid ${AC.gray2}`,
              fontFamily: FONT,
              fontSize: 14,
              color: AC.dark,
              background: AC.white,
              outline: 'none',
            }}
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                vs {m.opponent || 'TBC'} — {fmtDate(m.date)}{m.is_active ? ' (Active)' : ''}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* ── Section A: Player Pool ── */}
      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: AC.dark }}>Available Players</div>
            <div style={{ fontSize: 12, color: AC.gray3, marginTop: 2 }}>
              Players who responded Available · tap to add/remove
            </div>
          </div>
          <div
            style={{
              background: xi.length >= 11 ? AC.okBg : AC.greenBg,
              color: xi.length >= 11 ? AC.ok : AC.green,
              padding: '5px 14px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {xi.length}/11{reserves.length > 0 ? ` +${reserves.length}R` : ''}
          </div>
        </div>

        {availablePlayers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: AC.gray3,
              fontSize: 14,
              padding: '20px 0',
              background: AC.gray1,
              borderRadius: 10,
            }}
          >
            No players have responded as Available for this match yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {availablePlayers.map((player) => {
              const sel = selection.find((s) => s.player_id === player.id)
              const inXI = !!sel
              return (
                <div
                  key={player.id}
                  style={{
                    border: `1.5px solid ${inXI ? AC.green : AC.gray2}`,
                    borderRadius: 12,
                    background: inXI ? AC.greenBg : AC.white,
                    overflow: 'hidden',
                    transition: 'border-color .15s, background .15s',
                  }}
                >
                  {/* Main row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                    }}
                  >
                    <Avatar name={player.name} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: AC.dark }}>
                        {player.name}
                      </div>
                      <RolePill role={sel?.position || player.role || 'Player'} s={{ marginTop: 4 }} />
                    </div>
                    <button
                      onClick={() => togglePlayer(player)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: `1.5px solid ${inXI ? AC.green : AC.gray2}`,
                        background: inXI ? AC.green : AC.white,
                        color: inXI ? AC.white : AC.gray3,
                        cursor: 'pointer',
                        fontFamily: FONT,
                        fontSize: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all .15s',
                      }}
                    >
                      {inXI ? '✓' : '+'}
                    </button>
                  </div>

                  {/* Expanded options */}
                  {sel && (
                    <div
                      style={{
                        padding: '10px 14px 14px',
                        borderTop: `1px solid rgba(37,99,235,.15)`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: AC.gray3,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          marginBottom: 7,
                        }}
                      >
                        Batting Role
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {POSITIONS.map((pos) => (
                          <button
                            key={pos}
                            onClick={() => update(player.id, { position: pos })}
                            style={{
                              padding: '5px 13px',
                              borderRadius: 8,
                              border: `1.5px solid ${sel.position === pos ? AC.green : AC.gray2}`,
                              background: sel.position === pos ? AC.green : AC.white,
                              color: sel.position === pos ? AC.white : AC.gray4,
                              cursor: 'pointer',
                              fontFamily: FONT,
                              fontSize: 12,
                              fontWeight: 600,
                              transition: 'all .15s',
                            }}
                          >
                            {pos === 'Wicket-Keeper' ? 'WK-Bat' : pos}
                          </button>
                        ))}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: AC.gray3,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          marginBottom: 7,
                        }}
                      >
                        Designations
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <ToggleBtn
                          active={sel.is_captain}
                          color={AC.greenDark}
                          bgActive={AC.greenBg}
                          label="[C] Captain"
                          onClick={() => setCaptain(player.id)}
                        />
                        <ToggleBtn
                          active={sel.is_vice_captain}
                          color={AC.green}
                          bgActive={AC.greenBg}
                          label="[VC] Vice Captain"
                          onClick={() => setViceCaptain(player.id)}
                        />
                        <ToggleBtn
                          active={sel.is_wicketkeeper}
                          color="#d97706"
                          bgActive="#fffbeb"
                          label="[WK] Keeper"
                          onClick={() => update(player.id, { is_wicketkeeper: !sel.is_wicketkeeper })}
                        />
                        <ToggleBtn
                          active={sel.is_reserve}
                          color={AC.gray4}
                          bgActive={AC.gray1}
                          label="[R] Reserve"
                          onClick={() => update(player.id, { is_reserve: !sel.is_reserve })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Section B: Selected XI Preview ── */}
      {selection.length > 0 && (
        <Card>
          <div style={{ fontSize: 15, fontWeight: 700, color: AC.dark, marginBottom: 4 }}>
            Selected XI Preview
          </div>
          {selectedMatch && (
            <div style={{ fontSize: 12, color: AC.gray3, marginBottom: 16 }}>
              Tamil United CC vs {selectedMatch.opponent || 'TBC'} · {fmtDate(selectedMatch.date)}
            </div>
          )}

          {xi.length === 0 ? (
            <div style={{ color: AC.gray3, fontSize: 13, textAlign: 'center', padding: '10px 0' }}>
              No players in XI yet — add from pool above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {xi.map((s, i) => (
                <div
                  key={s.player_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    background: AC.gray1,
                    borderRadius: 10,
                  }}
                >
                  {/* Up/down */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <button
                      onClick={() => moveUp(s.player_id)}
                      disabled={i === 0}
                      style={{
                        width: 22,
                        height: 19,
                        border: `1px solid ${AC.gray2}`,
                        background: AC.white,
                        borderRadius: 4,
                        cursor: i === 0 ? 'default' : 'pointer',
                        opacity: i === 0 ? 0.3 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveDown(s.player_id)}
                      disabled={i === xi.length - 1}
                      style={{
                        width: 22,
                        height: 19,
                        border: `1px solid ${AC.gray2}`,
                        background: AC.white,
                        borderRadius: 4,
                        cursor: i === xi.length - 1 ? 'default' : 'pointer',
                        opacity: i === xi.length - 1 ? 0.3 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Batting number */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: AC.green,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: AC.dark, minWidth: 0 }}>
                    {s.player_name}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <RolePill role={s.position} />
                    {s.is_captain && (
                      <span
                        style={{
                          background: AC.greenBg,
                          color: AC.greenDark,
                          padding: '2px 7px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        C
                      </span>
                    )}
                    {s.is_vice_captain && (
                      <span
                        style={{
                          background: AC.greenBg,
                          color: AC.green,
                          padding: '2px 7px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        VC
                      </span>
                    )}
                    {s.is_wicketkeeper && (
                      <span
                        style={{
                          background: '#fffbeb',
                          color: '#d97706',
                          padding: '2px 7px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        WK
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {reserves.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: AC.gray3,
                  margin: '16px 0 8px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Reserves
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reserves.map((s) => (
                  <div
                    key={s.player_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: AC.gray1,
                      borderRadius: 10,
                      opacity: 0.75,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        background: AC.gray3,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      R
                    </div>
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: AC.gray4 }}>
                      {s.player_name}
                    </div>
                    <RolePill role={s.position} />
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* ── Section C: Publish Controls ── */}
      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: AC.dark }}>Publish Controls</div>
          <div
            style={{
              background: publishStatus === 'published' ? AC.okBg : AC.gray1,
              color:      publishStatus === 'published' ? AC.ok   : AC.gray4,
              padding: '4px 14px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {publishStatus === 'published' ? '✓ Published' : 'Draft'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            variant="ghost"
            size="full"
            onClick={() => saveSelection(false)}
            disabled={saving || selection.length === 0}
          >
            {saving ? 'Saving…' : '💾 Save Draft'}
          </Button>

          <Button
            variant="primary"
            size="full"
            onClick={() => {
              if (
                window.confirm(
                  'Publish team to all players? They will see this on the home page.'
                )
              ) {
                saveSelection(true)
              }
            }}
            disabled={saving || xi.length === 0}
          >
            {saving ? 'Publishing…' : '📢 Publish Team'}
          </Button>

          {publishStatus === 'published' && (
            <Button
              variant="danger"
              size="sm"
              style={{ alignSelf: 'flex-end' }}
              onClick={unpublish}
              disabled={saving}
            >
              🔒 Unpublish
            </Button>
          )}
        </div>

        {xi.length > 0 && xi.length < 11 && (
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              color: AC.gray3,
              textAlign: 'center',
            }}
          >
            {11 - xi.length} more player{11 - xi.length !== 1 ? 's' : ''} needed for a full XI
          </div>
        )}
      </Card>
    </div>
  )
}
