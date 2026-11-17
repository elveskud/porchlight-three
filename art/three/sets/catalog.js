// Sources: scripts/ep01.md ... ep06.md, plus their episode JSON location IDs.
// Classroom and Walt's hallway are still in first-round after the art reorganisation.
const painting = (file) => `art/gemini/${file.includes('/') ? file : `sets/${file}`}`;
const set = (id, name, build, mood, file, episodes, note, extra = {}) => ({
  id, name, build, mood, reference: painting(file), episodes, note, ...extra,
});
export const SETS = [
  set('lake', 'Lake · summer day', 'lake', 'day', 'lake_day_v2.jpg', [1,2,4], 'Full curved shoreline, lookout and dock, wooded banks, park paths, village and church, with the old hall across the water. Reverse and side views are built.'),
  set('lake_night', 'Lake · night', 'lake', 'night', 'lake_night_v2.jpg', [1,2,3,4,5,6], 'The complete lakeside environment at night: moonlit water, wooded banks, village windows and finished reverse views.'),
  set('lake_storm', 'Lake · storm night', 'lake', 'storm', 'lake_night_v2.jpg', [5], 'Storm lighting variant of the night painting. Mrs. Brook’s distant window holds a single candle.'),
  set('stoop_sunset', 'The stoop · sunset', 'stoop', 'sunset', 'stoop_sunset_v2.jpg', [1,3,4,6], 'Blue apartment door, brick facade, black railings, bicycle and three broad sitting steps.'),
  set('stoop_night', 'The stoop · night', 'stoop', 'night', 'stoop_night_v2.jpg', [1,3,6], 'The same steps under a working porch lantern. Four named sitting positions.'),
  set('apartment', 'Riot & Rocco’s apartment', 'apartment', 'night', 'apartment_night_v2.jpg', [1,4,5], 'Orange sofa, green beanbag, low game table, string lights and the blue night window.'),
  set('hall', 'Old festival hall · inside', 'hall', 'night', 'hall_inside_night_v2.jpg', [1,5], 'Timber boards, shuttered windows, bunting, red-curtained stage and a cloth-covered game table.'),
  set('hall_outside', 'Old festival hall · outside', 'hallExterior', 'sunset', 'hall_outside_sunset.jpg', [2], 'Weathered timber siding, boarded windows, cupola, front steps and an opening entrance door.'),
  set('bash_home', 'Bash’s bedroom', 'bashRoom', 'night', '17_bash_room_night.jpg', [2], 'Blue bedding, orange blanket, trophy shelf, basketball, study desk and a separate practice-game table.'),
  set('classroom', 'Summer classroom', 'classroom', 'day', 'first-round/c2_classroom_day.jpg', [3], 'Six paired desks, large green chalkboard, teacher’s desk, globe and tall left-hand windows.'),
  set('main_street', 'Main Street', 'street', 'day', '55_main_street_day_mailbox.jpg', [3,4], 'Striped shop awnings, stone paving, notice board, bench, blue mailbox and the clock tower.'),
  set('brook_porch', 'Mrs. Brook’s porch', 'brookPorch', 'day', '54_brook_porch_summer.jpg', [3], 'White porch boards, rocking chair, tea table, flower pots, paper chimes and a view over the lake.'),
  set('pip_home', 'Pip’s bedroom', 'pipRoom', 'night', '19_pip_room_night.jpg', [3], 'Checked bedding, writing desk, bookcase, green rug and the open bedroom door.'),
  set('pip_garage', 'Pip’s garage · one box', 'garage', 'evening', '56_pip_garage_one_box.jpg', [3], 'Exactly one sealed moving box on an otherwise empty floor; shelves, bicycle and garage door.'),
  set('park', 'Lakeside park', 'park', 'day', '23_park_day.jpg', [4], 'The old oak by the water, picnic tables, benches, reeds and the park notice board.'),
  set('walt_dining', 'Walt’s dining room · evening', 'dining', 'evening', '57_walt_dining_evening.jpg', [5], 'Five places at a generous dinner table, sideboard, framed pictures and an August 12 calendar.'),
  set('walt_dining_storm', 'Walt’s dining room · storm', 'dining', 'storm', '58_walt_dining_storm.jpg', [5], 'Same room and furniture; dark windows, candlelit table and switchable overhead light.'),
  set('walt_hallway', 'Walt’s photo hallway', 'hallway', 'evening', 'first-round/c6_walt_hallway.jpg', [5], 'Long runner, wall sconces, coat hooks, and framed existing grandfather photographs.'),
  set('walt_porch', 'Walt’s porch', 'waltPorch', 'sunset', '24_walt_porch_evening.jpg', [5], 'Timber porch, two chairs, blue shutters, flower pots and steps overlooking the street.'),
  set('school_gym', 'School gym · town meeting', 'gym', 'day', '25_school_gym.jpg', [6], 'Basketball floor, folding-chair rows with a clear centre aisle, stage, projector screen and microphone.'),
];
export const EPISODES = [
  {number:1, title:'Porch Light On', sets:['hall','lake','stoop_sunset','apartment','stoop_night','lake_night']},
  {number:2, title:'Dare House', sets:['lake','hall_outside','lake_night','bash_home']},
  {number:3, title:'Summer Homework', sets:['lake_night','classroom','stoop_sunset','main_street','brook_porch','pip_home','stoop_night','pip_garage']},
  {number:4, title:'Not For Sale', sets:['lake_night','park','apartment','lake','stoop_sunset','main_street']},
  {number:5, title:'Storm Night', sets:['walt_dining','walt_hallway','walt_porch','walt_dining_storm','lake_storm','hall','apartment']},
  {number:6, title:'Town Meeting', sets:['stoop_sunset','school_gym','stoop_night']},
];
export function resolveSet(value) {
  if (!value) return SETS[0];
  const stem = value.replace(/\.(jpg|png)$/i, '');
  return SETS.find(s => s.id === stem || s.reference.split('/').pop().replace(/\.[^.]+$/, '') === stem)
    || SETS.find(s => s.reference.split('/').pop().startsWith(value)) || null;
}
