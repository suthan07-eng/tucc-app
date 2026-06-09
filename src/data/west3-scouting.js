// ────────────────────────────────────────────────────────────────────────────
//  West 3 CC — Opposition Scouting Data (2024/25 season)
//  Parsed from statistics.xlsx (batting) + statistics(1).xlsx (bowling)
//  Composite scores computed: batting 40/25/15/10/10, bowling 40/30/20/10
// ────────────────────────────────────────────────────────────────────────────

// ── RAW BATTING (all 32 players) ─────────────────────────────────────────────
export const BATTING_RAW = [
  { name:'Imesh Rajapaksha',        matches:4, innings:4, notOuts:1, runs:367, hs:153, avg:122.33, sr:134.43, hundreds:2, fifties:1 },
  { name:'Sutharsan Sriyoganathan', matches:4, innings:4, notOuts:1, runs:171, hs:139, avg:57,    sr:80.28,  hundreds:1, fifties:0 },
  { name:'Kajeai Tharaneetharan',   matches:4, innings:4, notOuts:0, runs:172, hs:59,  avg:43,    sr:115.38, hundreds:0, fifties:2 },
  { name:'Sujan Sivakumar',         matches:5, innings:5, notOuts:1, runs:190, hs:52,  avg:47.5,  sr:96.36,  hundreds:0, fifties:1 },
  { name:'Jagath Jeevan',           matches:4, innings:4, notOuts:3, runs:159, hs:78,  avg:159,   sr:115.6,  hundreds:0, fifties:1 },
  { name:'Shandeepan Ratnakumar',   matches:7, innings:7, notOuts:0, runs:104, hs:52,  avg:14.86, sr:113.64, hundreds:0, fifties:1 },
  { name:'Ashen Kavinda',           matches:5, innings:5, notOuts:0, runs:103, hs:44,  avg:20.6,  sr:80.47,  hundreds:0, fifties:0 },
  { name:'Kajan Tharmasri',         matches:5, innings:5, notOuts:0, runs:101, hs:38,  avg:20.2,  sr:81.45,  hundreds:0, fifties:0 },
  { name:'Arunraj Sisirakumar',     matches:5, innings:5, notOuts:0, runs:87,  hs:34,  avg:17.4,  sr:67.44,  hundreds:0, fifties:0 },
  { name:'Mahinda Kumara Murugaya', matches:5, innings:5, notOuts:0, runs:76,  hs:28,  avg:15.2,  sr:72.38,  hundreds:0, fifties:0 },
  { name:'Jey Jeyashanker',         matches:5, innings:5, notOuts:1, runs:96,  hs:41,  avg:24,    sr:80.67,  hundreds:0, fifties:0 },
  { name:'Sujeevan Sarathchandra',  matches:4, innings:4, notOuts:0, runs:62,  hs:25,  avg:15.5,  sr:68.13,  hundreds:0, fifties:0 },
  { name:'Gajen Sorubakanthan',     matches:4, innings:3, notOuts:1, runs:55,  hs:35,  avg:27.5,  sr:91.67,  hundreds:0, fifties:0 },
  { name:'Harpreet Singh',          matches:3, innings:3, notOuts:0, runs:48,  hs:22,  avg:16,    sr:73.85,  hundreds:0, fifties:0 },
  { name:'Prasanna Rajasundaram',   matches:4, innings:4, notOuts:1, runs:61,  hs:30,  avg:20.33, sr:77.22,  hundreds:0, fifties:0 },
  { name:'Sachith Perera',          matches:3, innings:3, notOuts:0, runs:44,  hs:26,  avg:14.67, sr:69.84,  hundreds:0, fifties:0 },
  { name:'Sakthi Murugesan',        matches:3, innings:3, notOuts:1, runs:51,  hs:28,  avg:25.5,  sr:78.46,  hundreds:0, fifties:0 },
  { name:'Dinesh Rajapaksha',       matches:4, innings:4, notOuts:0, runs:58,  hs:21,  avg:14.5,  sr:65.91,  hundreds:0, fifties:0 },
  { name:'Suresh Kanthasamy',       matches:3, innings:3, notOuts:0, runs:36,  hs:18,  avg:12,    sr:60,     hundreds:0, fifties:0 },
  { name:'Krishanthan Sivapalan',   matches:4, innings:4, notOuts:1, runs:59,  hs:29,  avg:19.67, sr:76.62,  hundreds:0, fifties:0 },
  { name:'Paranjothy Sivarasa',     matches:3, innings:3, notOuts:0, runs:38,  hs:19,  avg:12.67, sr:63.33,  hundreds:0, fifties:0 },
  { name:'Thuvarakan Sivam',        matches:3, innings:3, notOuts:0, runs:34,  hs:22,  avg:11.33, sr:56.67,  hundreds:0, fifties:0 },
  { name:'Vathsalan Velupillai',    matches:3, innings:3, notOuts:1, runs:43,  hs:24,  avg:21.5,  sr:74.14,  hundreds:0, fifties:0 },
  { name:'Vishnu Sivanesan',        matches:3, innings:3, notOuts:0, runs:29,  hs:16,  avg:9.67,  sr:58.0,   hundreds:0, fifties:0 },
  { name:'Mekalan Murugathas',      matches:2, innings:2, notOuts:0, runs:24,  hs:18,  avg:12,    sr:66.67,  hundreds:0, fifties:0 },
  { name:'Thinesh Thevakumar',      matches:2, innings:2, notOuts:0, runs:21,  hs:15,  avg:10.5,  sr:61.76,  hundreds:0, fifties:0 },
  { name:'Satheesh Navaratnam',     matches:2, innings:2, notOuts:0, runs:19,  hs:14,  avg:9.5,   sr:59.38,  hundreds:0, fifties:0 },
  { name:'Sanjeevan Karunanithi',   matches:2, innings:2, notOuts:0, runs:17,  hs:13,  avg:8.5,   sr:58.62,  hundreds:0, fifties:0 },
  { name:'Vinothkumar Karunakaran', matches:2, innings:2, notOuts:0, runs:15,  hs:12,  avg:7.5,   sr:57.69,  hundreds:0, fifties:0 },
  { name:'Rajan Rajendran',         matches:2, innings:2, notOuts:0, runs:12,  hs:9,   avg:6,     sr:52.17,  hundreds:0, fifties:0 },
  { name:'Kumaran Selvakumar',      matches:1, innings:1, notOuts:0, runs:8,   hs:8,   avg:8,     sr:50,     hundreds:0, fifties:0 },
  { name:'Balachandran Thayalan',   matches:1, innings:1, notOuts:0, runs:5,   hs:5,   avg:5,     sr:45.45,  hundreds:0, fifties:0 },
]

// ── RAW BOWLING (all 18 players) ────────────────────────────────────────────
export const BOWLING_RAW = [
  { name:'Kajan Tharmasri',         matches:5, overs:42.3, wickets:14, runs:160, avg:11.43, econ:3.72, sr:18.43, best:'5/27', fiveWickets:1 },
  { name:'Ashen Kavinda',           matches:5, overs:40.1, wickets:13, runs:178, avg:13.69, econ:4.41, sr:18.62, best:'5/26', fiveWickets:1 },
  { name:'Sujan Sivakumar',         matches:5, overs:39.2, wickets:13, runs:200, avg:15.38, econ:5.09, sr:18.15, best:'3/23', fiveWickets:0 },
  { name:'Arunraj Sisirakumar',     matches:5, overs:34.4, wickets:11, runs:166, avg:15.09, econ:4.81, sr:18.91, best:'4/38', fiveWickets:0 },
  { name:'Gajen Sorubakanthan',     matches:4, overs:6.3,  wickets:3,  runs:22,  avg:7.33,  econ:3.38, sr:13,    best:'3/22', fiveWickets:0 },
  { name:'Mahinda Kumara Murugaya', matches:5, overs:33.1, wickets:8,  runs:158, avg:19.75, econ:4.77, sr:24.88, best:'4/29', fiveWickets:0 },
  { name:'Shandeepan Ratnakumar',   matches:5, overs:30.0, wickets:6,  runs:160, avg:26.67, econ:5.33, sr:30,    best:'2/24', fiveWickets:0 },
  { name:'Jey Jeyashanker',         matches:5, overs:29.2, wickets:7,  runs:148, avg:21.14, econ:5.05, sr:25.14, best:'3/28', fiveWickets:0 },
  { name:'Imesh Rajapaksha',        matches:4, overs:25.0, wickets:7,  runs:128, avg:18.29, econ:5.12, sr:21.43, best:'3/31', fiveWickets:0 },
  { name:'Sujeevan Sarathchandra',  matches:3, overs:18.0, wickets:4,  runs:84,  avg:21,    econ:4.67, sr:27,    best:'2/22', fiveWickets:0 },
  { name:'Prasanna Rajasundaram',   matches:3, overs:17.0, wickets:3,  runs:82,  avg:27.33, econ:4.82, sr:34,    best:'2/26', fiveWickets:0 },
  { name:'Harpreet Singh',          matches:3, overs:15.0, wickets:3,  runs:76,  avg:25.33, econ:5.07, sr:30,    best:'2/23', fiveWickets:0 },
  { name:'Kajeai Tharaneetharan',   matches:3, overs:14.0, wickets:3,  runs:72,  avg:24,    econ:5.14, sr:28,    best:'2/19', fiveWickets:0 },
  { name:'Sutharsan Sriyoganathan', matches:2, overs:10.0, wickets:2,  runs:48,  avg:24,    econ:4.80, sr:30,    best:'1/14', fiveWickets:0 },
  { name:'Sakthi Murugesan',        matches:2, overs:9.0,  wickets:2,  runs:44,  avg:22,    econ:4.89, sr:27,    best:'1/16', fiveWickets:0 },
  { name:'Krishanthan Sivapalan',   matches:2, overs:8.0,  wickets:1,  runs:40,  avg:40,    econ:5.0,  sr:48,    best:'1/18', fiveWickets:0 },
  { name:'Dinesh Rajapaksha',       matches:2, overs:7.0,  wickets:1,  runs:38,  avg:38,    econ:5.43, sr:42,    best:'1/20', fiveWickets:0 },
  { name:'Jagath Jeevan',           matches:2, overs:6.0,  wickets:1,  runs:30,  avg:30,    econ:5.0,  sr:36,    best:'1/14', fiveWickets:0 },
]

// ── TOP 6 BATTERS ────────────────────────────────────────────────────────────
export const TOP_BATTERS = [
  {
    rank: 1,
    name: 'Imesh Rajapaksha',
    initials: 'IR',
    role: 'Bat',
    compositeScore: 95.7,
    badge: 'AVOID',
    badgeColor: '#dc2626',
    stats: { runs: 367, avg: 122.33, sr: 134.43, hs: 153, hundreds: 2, fifties: 1, innings: 4 },
    flag: '⚠️ Inflated avg (1 not-out)',
    summary: 'West 3\'s standout batter by a country mile. Two centuries and a fifty in just four innings — including a match-winning 153* — with a strike rate of 134. He rarely gets dismissed, so his average is inflated, but the volume and quality of runs are unquestionably real.',
    strengths: ['Two centuries in the same season', 'Exceptional acceleration after 30 balls', 'Strike rate of 134 — can shift the game in 3 overs'],
    weaknesses: ['Small sample (4 innings)', 'May be vulnerable early before he settles in', 'Also bowls — used to the conditions'],
    howToPlay: 'Post your best bowler against him early. Bowl tight off-stump lines, no short stuff, no width. Aim to dismiss him inside the first 8 balls or build pressure for 3+ overs before he gets set. Once he\'s past 20 he becomes very hard to stop.',
  },
  {
    rank: 2,
    name: 'Sutharsan Sriyoganathan',
    initials: 'SS',
    role: 'Bat',
    compositeScore: 58.3,
    badge: 'CONTAIN',
    badgeColor: '#d97706',
    stats: { runs: 171, avg: 57, sr: 80.28, hs: 139, hundreds: 1, fifties: 0, innings: 4 },
    flag: null,
    summary: 'A classical accumulator who builds to match-winning totals. His 139* shows he converts when in. The relatively low SR (80) means he needs time to build — contain him early with dot balls and he becomes less dangerous. But if he settles in the top order, he can bat through an innings.',
    strengths: ['Converts big — 139* is a match-winning knock', 'Top-order anchor, rarely throws it away'],
    weaknesses: ['SR 80 is below tournament average — slow burn', 'Dot-ball pressure disrupts his rhythm'],
    howToPlay: 'Bowl back-of-length, deny the easy single. Keep dot-ball pressure consistent. If he plays a big shot early, he\'s trying to break the shackles — take the risk. Rotating bowlers helps keep him guessing.',
  },
  {
    rank: 3,
    name: 'Kajeai Tharaneetharan',
    initials: 'KT',
    role: 'Bat',
    compositeScore: 55.7,
    badge: 'CONTAIN',
    badgeColor: '#d97706',
    stats: { runs: 172, avg: 43, sr: 115.38, hs: 59, hundreds: 0, fifties: 2, innings: 4 },
    flag: null,
    summary: 'Their most consistent volume batter — two fifties at SR 115 makes him a genuine middle-order threat. He plays to his scoring areas effectively and doesn\'t give it away. Yet to convert a fifty to a century, suggesting a possible ceiling around 50-70.',
    strengths: ['Consistent half-century maker, SR 115 is excellent', 'Does not throw his wicket away'],
    weaknesses: ['Yet to convert a fifty (top score 59)', 'May become loose in the 50-70 range'],
    howToPlay: 'When he reaches 40+, change the bowler to break his rhythm. Introduce a spinner or a change of pace. He tends to play more aggressively once set — use that against him with a fine leg or deep square.',
  },
  {
    rank: 4,
    name: 'Sujan Sivakumar',
    initials: 'SJS',
    role: 'All',
    compositeScore: 54.3,
    badge: 'AVOID',
    badgeColor: '#dc2626',
    stats: { runs: 190, avg: 47.5, sr: 96.36, hs: 52, hundreds: 0, fifties: 1, innings: 5 },
    flag: '⚡ Dual threat — also 13 wkts',
    summary: 'Their most impactful all-rounder on paper. Leads team batting volume (190 runs) AND is their second highest wicket-taker (13 wkts). A dual threat — losing his wicket early AND not attacking when he bowls are both critical tactical wins.',
    strengths: ['190 runs across 5 innings — most consistent contributor', 'Also 13 wickets with the ball', 'Steady, rarely throws it away'],
    weaknesses: ['Economy 5.09 with the ball — expensive', 'SR 96 is decent but not explosive'],
    howToPlay: 'Attack him when he bowls (economy 5.09 is the most expensive of their top bowlers). With the bat, treat his wicket like a top-3 prize — the double blow of removing him disrupts their bowling rotation too.',
  },
  {
    rank: 5,
    name: 'Jagath Jeevan',
    initials: 'JJ',
    role: 'Bat',
    compositeScore: 54.2,
    badge: 'TARGET',
    badgeColor: '#16a34a',
    stats: { runs: 159, avg: 159, sr: 115.6, hs: 78, hundreds: 0, fifties: 1, innings: 4 },
    flag: '⚠️ Inflated avg (3 not-outs in 4 innings)',
    summary: 'Impressive numbers but heavily inflated by three not-outs in just four innings. His average of 159 is meaningless — he\'s likely a middle-order finisher who doesn\'t face much pressure. SR of 115.6 is real, and 78* shows he can accelerate, but he hasn\'t been truly tested.',
    strengths: ['Quick scorer (SR 115.6)', '78* shows he can build an innings'],
    weaknesses: ['Three not-outs in four innings — thin dismissal record', 'Very small sample, hasn\'t faced real pressure'],
    howToPlay: 'Bowl short and make him play. Use a hard-hitting yorker approach at the death. He hasn\'t proved he can handle sustained pressure — get him early and his stats crumble.',
  },
  {
    rank: 6,
    name: 'Shandeepan Ratnakumar',
    initials: 'SR',
    role: 'All',
    compositeScore: 49.6,
    badge: 'TARGET',
    badgeColor: '#16a34a',
    stats: { runs: 104, avg: 14.86, sr: 113.64, hs: 52, hundreds: 0, fifties: 1, innings: 7 },
    flag: '⚡ Also bowls — econ 5.33',
    summary: 'A bits-and-pieces lower-order all-rounder. SR 113 with the bat is useful at the death, but average 14.86 across 7 innings tells the true story — he doesn\'t go big consistently. With the ball, his economy of 5.33 makes him the most expensive of their regular bowlers.',
    strengths: ['SR 113 can cause late-order damage', 'One fifty shows he can score when conditions are right'],
    weaknesses: ['Average 14.86 is low — frequently dismissed for small scores', 'Most expensive bowler (econ 5.33)'],
    howToPlay: 'Attack him when he bowls — he will leak runs. With bat: use a mid-off/mid-on catching position, he tends to slog early.',
  },
]

// ── TOP 6 BOWLERS ────────────────────────────────────────────────────────────
export const TOP_BOWLERS = [
  {
    rank: 1,
    name: 'Kajan Tharmasri',
    initials: 'KJT',
    role: 'Bowl',
    compositeScore: 91.8,
    badge: 'AVOID',
    badgeColor: '#dc2626',
    stats: { wickets: 14, avg: 11.43, econ: 3.72, sr: 18.43, best: '5/27', fiveWickets: 1, overs: 42.3 },
    flag: '🏆 5-wicket haul',
    summary: 'West 3\'s most dangerous bowler — 14 wickets at 11.43 with an economy of just 3.72 is exceptional at this level. His 5/27 proves he can rip through a batting lineup on his day. He is their spearhead. Treating him with extreme respect is not optional.',
    strengths: ['14 wickets at 11.43 — elite average for this level', '5/27 best figures — match-winning threat', 'Economy 3.72 builds immense pressure'],
    weaknesses: ['SR 18.43 — needs time to build, not an instant striker', 'Best attacked in short bursts after 4+ overs'],
    howToPlay: 'Your most patient batsman should face him. Rotate strike, no big shots, look to score off the other end. If he pitches short, leave or sway — don\'t hook. Attack when he comes back for a second spell and the ball is softer.',
  },
  {
    rank: 2,
    name: 'Ashen Kavinda',
    initials: 'AK',
    role: 'Bowl',
    compositeScore: 83.0,
    badge: 'AVOID',
    badgeColor: '#dc2626',
    stats: { wickets: 13, avg: 13.69, econ: 4.41, sr: 18.62, best: '5/26', fiveWickets: 1, overs: 40.1 },
    flag: '🏆 5-wicket haul',
    summary: 'Equally devastating as Kajan and arguably more dangerous match-to-match. 5/26 is their most economical 5-wicket haul and 13 wickets at 13.69 shows consistent penetration. He and Kajan are West 3\'s new-ball pairing — facing both on any given day without losing 3 wickets inside 10 overs is the challenge.',
    strengths: ['5-wicket haul at 5.26 — most lethal performer on his day', 'Consistent across all 5 matches', 'Good in early overs with new ball movement'],
    weaknesses: ['Economy 4.41 is slightly more expensive than Kajan', 'Can be attacked in middle overs after the ball is older'],
    howToPlay: 'Same approach as Kajan — patience and rotation. He becomes more attackable in overs 8-14. Pull shot works if he drops short; drive if he strays full outside off.',
  },
  {
    rank: 3,
    name: 'Sujan Sivakumar',
    initials: 'SJS',
    role: 'Bowl',
    compositeScore: 81.6,
    badge: 'CONTAIN',
    badgeColor: '#d97706',
    stats: { wickets: 13, avg: 15.38, econ: 5.09, sr: 18.15, best: '3/23', fiveWickets: 0, overs: 39.2 },
    flag: '⚡ Also top batter',
    summary: 'Their third major wicket-taker (13 wkts) and the most attackable of the top three. Economy 5.09 is the worst of their starting bowlers — every over he bowls leaks roughly 5 runs. He\'s a genuine threat (best 3/23) but can be scored off, particularly in his second spell.',
    strengths: ['13 wickets at 15.38 — still a genuine wicket-taker', 'Consistent enough to bowl long spells'],
    weaknesses: ['Economy 5.09 is most expensive of their top 3 bowlers', 'No five-wicket haul — doesn\'t blow sides away'],
    howToPlay: 'When he strays onto the pads, work the leg side. Drive through covers if he\'s too full. A calculated 10-12 runs per over approach works well here — it\'s possible without taking big risks.',
  },
  {
    rank: 4,
    name: 'Arunraj Sisirakumar',
    initials: 'AS',
    role: 'Bowl',
    compositeScore: 73.8,
    badge: 'TARGET',
    badgeColor: '#16a34a',
    stats: { wickets: 11, avg: 15.09, econ: 4.81, sr: 18.91, best: '4/38', fiveWickets: 0, overs: 34.4 },
    flag: null,
    summary: 'A steady workhorse — 11 wickets but his best figures required 38 runs to get there. Economy 4.81 is beatable. Not a match-winner on his own but will keep an end tight unless actively targeted. His 4-wicket haul took 4 overs of scoring — a disciplined aggressor can exploit this.',
    strengths: ['11 wickets — consistent threat over the season', 'Keeps a good length, not easy to hit through the line'],
    weaknesses: ['Economy 4.81 — attackable, particularly in the 9-15 over range', 'Best of 4/38 suggests he concedes freely while taking wickets'],
    howToPlay: 'Attack on the leg side and through the arc from mid-on to mid-wicket. Take the single on offer every time — his SR 18.91 means he needs to bowl 19 balls per wicket. Back yourself to score freely.',
  },
  {
    rank: 5,
    name: 'Gajen Sorubakanthan',
    initials: 'GS',
    role: 'Bowl',
    compositeScore: 68.5,
    badge: 'WATCH',
    badgeColor: '#7c3aed',
    stats: { wickets: 3, avg: 7.33, econ: 3.38, sr: 13, best: '3/22', fiveWickets: 0, overs: 6.3 },
    flag: '⚠️ Small sample (6.3 overs only)',
    summary: 'Exceptional numbers but from just 6.3 overs — a very small sample. His 3/22 at economy 3.38 is the best economy in the team, but it\'s unclear how he performs over longer spells or against a settled batting lineup. Handle with caution — if he bowls, don\'t attack him blindly.',
    strengths: ['Best economy rate in the team (3.38)', '3/22 shows he can take wickets cheaply'],
    weaknesses: ['6.3 overs total — insufficient data for full assessment', 'Unknown how he bowls under sustained pressure'],
    howToPlay: 'Respect him early. Play him as you would a mystery spinner — watch the ball carefully and rotate. If he strays off-line by ball 4-5, then look for the scoring shot. Do NOT simply attack from ball 1.',
  },
  {
    rank: 6,
    name: 'Mahinda Kumara Murugaya',
    initials: 'MK',
    role: 'Bowl',
    compositeScore: 64.7,
    badge: 'CONTAIN',
    badgeColor: '#d97706',
    stats: { wickets: 8, avg: 19.75, econ: 4.77, sr: 24.88, best: '4/29', fiveWickets: 0, overs: 33.1 },
    flag: null,
    summary: 'A mid-tier bowler who earns his wickets with economy bowling. Average 19.75 and economy 4.77 make him beatable — he\'s no match for Kajan or Ashen. His 4/29 best is respectable but suggests he bowls to take wickets through attrition rather than raw pace or movement.',
    strengths: ['8 wickets in the season — not easily dismissed', '4/29 is a decent best — can have good days'],
    weaknesses: ['Average 19.75 and economy 4.77 — both attackable', 'SR 24.88 — slowest strike rate of the top bowlers'],
    howToPlay: 'Play him sensibly in his first two overs, then look to score. Particularly in his second spell (overs 14+), the ball is older and he becomes more predictable. Drive on the full, pull the short one.',
  },
]

// ── TOP 6 ALL-ROUNDERS ───────────────────────────────────────────────────────
export const TOP_ALLROUNDERS = [
  {
    rank: 1,
    name: 'Imesh Rajapaksha',
    initials: 'IR',
    compositeScore: 84.5,
    batScore: 100,
    bowlScore: 69,
    badge: 'AVOID',
    badgeColor: '#dc2626',
    batStats: { runs: 367, avg: 122.33, sr: 134.43, hs: 153 },
    bowlStats: { wickets: 7, avg: 18.29, econ: 5.12, best: '3/31' },
    summary: 'The standout all-rounder — maximum batting score (367 runs, 2 tons, SR 134) plus 7 wickets with the ball at 5.12 economy. He is their most complete and dangerous player by a large margin. Conceding even 30-40 runs to him in the first 8 overs can put a match beyond reach.',
  },
  {
    rank: 2,
    name: 'Sujan Sivakumar',
    initials: 'SJS',
    compositeScore: 72.8,
    batScore: 56.7,
    bowlScore: 88.9,
    badge: 'AVOID',
    badgeColor: '#dc2626',
    batStats: { runs: 190, avg: 47.5, sr: 96.36, hs: 52 },
    bowlStats: { wickets: 13, avg: 15.38, econ: 5.09, best: '3/23' },
    summary: 'Their most balanced all-rounder in terms of contribution. While his batting score (56.7) is slightly below his bowling score (88.9), he contributes consistently in both departments across every match. Removing him cheaply with bat AND targeting him when he bowls are both tactical wins.',
  },
  {
    rank: 3,
    name: 'Ashen Kavinda',
    initials: 'AK',
    compositeScore: 64.2,
    batScore: 37.9,
    bowlScore: 90.4,
    badge: 'CONTAIN',
    badgeColor: '#d97706',
    batStats: { runs: 103, avg: 20.6, sr: 80.47, hs: 44 },
    bowlStats: { wickets: 13, avg: 13.69, econ: 4.41, best: '5/26' },
    summary: 'A genuine all-rounder skewed heavily towards bowling — his 5/26 is one of the most dangerous individual performances in West 3\'s season. Batting contribution (103 runs, SR 80) is modest but adds depth. Primary threat is with the ball; treat his batting as a bonus.',
  },
  {
    rank: 4,
    name: 'Arunraj Sisirakumar',
    initials: 'AS',
    compositeScore: 54.8,
    batScore: 29.2,
    bowlScore: 80.4,
    badge: 'CONTAIN',
    badgeColor: '#d97706',
    batStats: { runs: 87, avg: 17.4, sr: 67.44, hs: 34 },
    bowlStats: { wickets: 11, avg: 15.09, econ: 4.81, best: '4/38' },
    summary: 'More of a bowling all-rounder — his batting contribution is modest (87 runs, SR 67) but useful lower down. Primary value is in the bowling attack where 11 wickets at 15 makes him a consistent contributor. Not a match-winner with either discipline but reliably contributes.',
  },
  {
    rank: 5,
    name: 'Shandeepan Ratnakumar',
    initials: 'SR',
    compositeScore: 52.9,
    batScore: 51.8,
    bowlScore: 53.9,
    badge: 'TARGET',
    badgeColor: '#16a34a',
    batStats: { runs: 104, avg: 14.86, sr: 113.64, hs: 52 },
    bowlStats: { wickets: 6, avg: 26.67, econ: 5.33, best: '2/24' },
    summary: 'The most balanced but least threatening of the top all-rounders — roughly equal contribution in both departments, but both are below average. His batting SR of 113 can cause late damage, and he bowls regularly, but economy 5.33 and batting average 14.86 both scream "target me".',
  },
  {
    rank: 6,
    name: 'Jey Jeyashanker',
    initials: 'JJS',
    compositeScore: 41.5,
    batScore: 40.1,
    bowlScore: 42.8,
    badge: 'TARGET',
    badgeColor: '#16a34a',
    batStats: { runs: 96, avg: 24, sr: 80.67, hs: 41 },
    bowlStats: { wickets: 7, avg: 21.14, econ: 5.05, best: '3/28' },
    summary: 'A useful squad all-rounder but neither department is particularly threatening. SR 80.67 with the bat is below par, and economy 5.05 with 7 wickets at 21 is attackable. He plugs gaps but doesn\'t win matches on his own. Attack his bowling, be patient against his batting.',
  },
]

// ── MATCH PLAN ───────────────────────────────────────────────────────────────
export const MATCH_PLAN = {
  executiveSummary: 'West 3 CC are built around two elite new-ball bowlers (Kajan & Ashen, both with 5WH) and one exceptional batter (Imesh, 2x centuries). Their middle order is inconsistent — take out Imesh and Sujan early and their batting becomes manageable. When bowling, respect Kajan and Ashen but attack Sujan, Arunraj, and Shandeepan.',

  battingPriorities: [
    { priority: 1, text: 'Survive Kajan Tharmasri and Ashen Kavinda\'s opening spells (overs 1-8). Do NOT attack them. Rotate strike, take singles, no heroes.', icon: '🛡️' },
    { priority: 2, text: 'Attack Sujan Sivakumar when he bowls — economy 5.09 is a full run above the top pair. Target the arc from mid-on to mid-wicket.', icon: '⚔️' },
    { priority: 3, text: 'Treat Arunraj and Shandeepan as scoreable — economy 4.81/5.33 and average 15/26. Look for boundaries in their 2nd spells.', icon: '📊' },
    { priority: 4, text: 'Gajen Sorubakanthan (3.38 econ) is a wildcard if used — play him cautiously for the first 2-3 overs before judging.', icon: '⚠️' },
  ],

  bowlingPriorities: [
    { priority: 1, text: 'Get Imesh Rajapaksha in the first 6 balls. Post your strike bowler vs him. No width, no short stuff — bowl a tight off-stump channel.', icon: '🎯' },
    { priority: 2, text: 'Dismiss Sujan Sivakumar cheaply — double win: removes their best volume scorer AND disrupts bowling rotation.', icon: '🎯' },
    { priority: 3, text: 'Kajeai Tharaneetharan (SR 115, 2x50s) is their most consistent batter. Rotate bowlers when he reaches 40 to break his rhythm.', icon: '🎯' },
    { priority: 4, text: 'Attack Shandeepan Ratnakumar when he bowls (econ 5.33 — most expensive). Drive or pull, look for 10+ off his overs.', icon: '⚔️' },
  ],

  fieldingNotes: [
    'Set a catching cordon for Imesh Rajapaksha — he drives hard through the off side when he gets going.',
    'Keep a deep fine leg when Jagath Jeevan bats — he plays the pull shot aggressively.',
    'Point and backward point are scoring areas for Kajeai — consider a deeper extra cover or point early.',
    'When Shandeepan bats in the lower order, set a catching mid-on and mid-off — he tends to slog early.',
  ],

  bowlingOrder: [
    { slot: 'Over 1', recommendation: 'Your best seamer — attack stump-to-stump, new ball, vs Imesh Rajapaksha' },
    { slot: 'Over 2', recommendation: 'Your second seamer — build pressure from the other end' },
    { slot: 'Over 4-8', recommendation: 'Rotate your top two bowlers — Kajan & Ashen will be doing the same to you' },
    { slot: 'Over 9-14', recommendation: 'Introduce spin or a change of pace — Sujan Sivakumar period on the other side' },
    { slot: 'Over 15-20', recommendation: 'Best death bowler for yorkers, Jeevan and Shandeepan bat at 5-7 in the lower middle' },
  ],
}

// ── CHART DATA ───────────────────────────────────────────────────────────────
export const BATTING_CHART = BATTING_RAW
  .filter(p => p.innings >= 2)
  .sort((a, b) => b.runs - a.runs)
  .slice(0, 8)
  .map(p => ({ name: p.name.split(' ')[0], runs: p.runs, sr: p.sr, avg: p.avg }))

export const BOWLING_CHART = BOWLING_RAW
  .filter(p => p.overs >= 10)
  .sort((a, b) => b.wickets - a.wickets)
  .slice(0, 8)
  .map(p => ({ name: p.name.split(' ')[0], wickets: p.wickets, econ: p.econ, avg: p.avg }))

export const SCATTER_BATTING = BATTING_RAW
  .filter(p => p.innings >= 2)
  .map(p => ({ name: p.name.split(' ')[0], runs: p.runs, sr: p.sr }))

export const SCATTER_BOWLING = BOWLING_RAW
  .filter(p => p.overs >= 10)
  .map(p => ({ name: p.name.split(' ')[0], wickets: p.wickets, econ: p.econ }))

export const RADAR_ALLROUNDERS = TOP_ALLROUNDERS.slice(0, 3).map(p => ({
  name: p.name.split(' ')[0],
  'Bat Score': Math.round(p.batScore),
  'Bowl Score': Math.round(p.bowlScore),
  'Overall': Math.round(p.compositeScore),
}))
