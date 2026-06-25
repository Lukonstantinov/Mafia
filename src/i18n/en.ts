export const en = {
  brand: 'Night Table',
  eyebrow: "The Mayor's Console",
  tagline: 'Deal the night. Run the table.',

  // Home
  home_pickPreset: 'Pick a preset to start, or build your own roster of roles.',
  home_classic: 'Classic 11',
  home_starter: 'Starter 8',
  home_scratch: 'New game from scratch',
  home_scratch_sub: 'Choose count, roles & rules yourself',
  home_players: 'players',

  // Player-do-not-open instructions (shown on home + deal)
  instr_title: 'Players: do not open the app',
  instr_body:
    'Only the mayor (host) holds the phone. Players never open or operate the app — you would see secret roles. When it is your turn, the mayor hands you the phone showing only your own card. Look, hide it, and pass it back.',
  instr_short: 'Only the mayor operates the phone. Players: never open the app yourself.',

  // generic
  back: 'Back',
  next: 'Next',
  moveOn: 'Move on',
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  done: 'Done',
  start: 'Start',
  reshuffle: 'Reshuffle',
  seat: 'Seat',

  // Setup
  setup_title: 'Set up the table',
  setup_count: 'Player count',
  setup_names: 'Names (optional)',
  setup_names_ph: 'Anna, Ben, Chris … (comma separated)',
  setup_roles: 'Roles',
  setup_citizensFill: 'Citizens fill the rest',
  setup_roleCreator: 'Role Creator',
  setup_nightOrder: 'Night Order',
  setup_settings: 'Settings',
  setup_total: 'assigned',
  setup_over: 'Too many roles for the player count.',

  // Role Creator
  rc_title: 'Role Creator',
  rc_name: 'Role name',
  rc_desc: 'Description',
  rc_icon: 'Icon (emoji or letter)',
  rc_color: 'Card colour',
  rc_team: 'Team',
  rc_actsAtNight: 'Acts at night',
  rc_save: 'Save role',
  team_mafia: 'Mafia',
  team_town: 'Town',
  team_neutral: 'Neutral',

  // Night order
  no_title: 'Night Order',
  no_sub: 'Drag to reorder. Ends are pinned.',
  no_citySleeps: 'City sleeps',
  no_cityVote: 'City / Citizens vote',

  // Settings
  set_title: 'Settings',
  set_actions: 'Actions per role',
  set_doctorSelfHeal: 'Doctor may heal self',
  set_mafiaRatio: 'Mafia wins at equal numbers',
  set_townLast: 'Town wins when last mafia is out',
  set_story: 'Generate round story',
  set_log: 'Round log & timers',

  // Assign
  assign_title: 'Dealing the roles',
  assign_spinning: 'Shuffling roles across the seats…',
  assign_seeResult: 'See result',

  // Tally
  tally_title: 'All done',
  tally_sub: 'Roles distributed across the seats.',
  tally_startDealing: 'Start dealing',

  // Deal
  deal_passTo: 'pass to',
  deal_tap: 'Tap the card to reveal your role',
  deal_the: 'The',
  deal_hide: 'Hide & pass',
  deal_secret: 'Keep it secret. Hide before you pass.',

  // Gate
  gate_title: 'All roles dealt',
  gate_sub: 'The phone now becomes the mayor’s console.',
  gate_imMayor: "I'm the Mayor",
  gate_confirmTitle: 'Are you the mayor?',
  gate_confirmBody: "You'll see every player's secret role. Only the host should continue.",
  gate_confirmYes: 'Yes, I am the mayor',

  // Table
  table_start: 'Start game',
  table_inspect: 'Tap a seat to inspect',
  table_proceed: 'Proceed',
  table_round: 'Round',
  table_picks: "Tonight's picks",
  table_whosLeft: "Who's left",
  table_log: 'Round log',
  table_resolve: 'Resolve round',
  table_finish: 'Finish',
  table_alive: 'alive',
  table_dead: 'dead',
  table_noPick: 'No pick yet',
  table_tapTarget: 'Tap a seat, then Proceed',
  step_cityVote: 'City vote',
  tag_targeted: 'targeted',
  tag_checked: 'checked',
  tag_healed: 'healed',
  tag_silenced: 'silenced',
  tag_voted: 'voted out',
  check_isMafia: 'is Mafia',
  check_notMafia: 'not Mafia',

  // Resolution
  res_title: 'Resolve the round',
  res_sub: 'Confirm who dies. Doctor saves cancel a mafia hit.',
  res_saved: 'saved',
  res_confirmDeaths: 'Confirm deaths',
  res_nobody: 'Nobody dies this round',
  res_continue: 'Continue to next round',

  // Win
  win_townTitle: 'Town wins',
  win_mafiaTitle: 'Mafia wins',
  win_keepPlaying: 'Keep playing',
  win_suggest: 'Suggestion only — the mayor decides.',

  // Finish
  finish_warn1_title: 'Finish this game?',
  finish_warn1_body: 'This ends the current game and clears the table.',
  finish_warn2_title: 'Are you absolutely sure?',
  finish_warn2_body: 'All roles, picks and the round log will be erased. This cannot be undone.',
  finish_yes: 'Yes, finish',
  finish_reallyYes: 'Erase and start over',

  // roles (built-in)
  role_mafia: 'Mafia',
  role_mafia_desc: 'Wakes at night and chooses one player to eliminate.',
  role_police: 'Police',
  role_police_desc: 'Each night checks one player to learn if they are Mafia.',
  role_doctor: 'Doctor',
  role_doctor_desc: 'Each night heals one player; a heal cancels the mafia hit.',
  role_butterfly: 'Butterfly',
  role_butterfly_desc: 'Silences one player for the coming day.',
  role_citizen: 'Citizen',
  role_citizen_desc: 'An ordinary townsperson with no night action.',
};
export type Dict = typeof en;
