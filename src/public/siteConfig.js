export const SITE = {
  clubName: 'Tamil United Cricket Club',
  clubShortName: 'TU CC',
  legalName: 'Dollishill Tamil United', // used only for legal/official contexts
  founded: null, // TODO: confirm correct year — flagged for manual review
  tagline: 'Where Passion Meets Precision',
  tagline2: 'Unity in whites. Power in numbers. Heart in every match.',
  email: 'info@tucc.club', // flagged: was info@dtucc.com — confirm with user
  phone: '+44 7494 964762',
  address: '27 Orchard Gate, Greenford, Middlesex, UB6 0QL',
  hours: 'Mon–Fri 8am–5pm · Sat by appointment',
  league: 'British Tamils Cricket League',
  logo: '/logo.png',
  socials: { // PLACEHOLDERS — user must fill in real URLs
    twitter: null,
    facebook: null,
    instagram: null,
    youtube: null,
  },
  colors: { primary: '#2563eb', dark: '#1e3a8a', gold: '#e9a020' },
  sponsors: [
    { tier: 'Platinum', name: 'GPS Group of Companies', url: 'https://www.gpsgroupofcompanies.com/', logo: '/sponsors/gps-group.png' },
    { tier: 'Gold',     name: 'Sangeetha Jewellers',   url: 'https://sangeethajewellers.co.uk/',   logo: '/sponsors/sangeetha-jewellers.png' },
    { tier: 'Silver',   name: 'Praba Restaurant & Bar',url: 'https://prabarestaurant.com/',         logo: '/sponsors/praba-restaurant.png' },
    { tier: 'Silver',   name: 'Lotus Living',           url: 'https://lotusliving.co.uk/',          logo: '/sponsors/lotus-living.png' },
    { tier: 'Bronze',   name: 'NSKA Accountancy',       url: 'https://www.nska-accountancy.co.uk/', logo: '/sponsors/nska-accountancy.png' },
    { tier: 'Bronze',   name: 'Palm Beach',             url: 'https://palmbeachuk.com/',            logo: '/sponsors/palm-beach.png' },
  ],
  committee: [
    { name: 'Pathmanathan Giritharan',     role: '4th Patron',                   photo: '/committee/giritharan.jpg' },
    { name: 'Raj Sorna',                   role: 'Chairman',                     photo: '/committee/raj-sorna.jpg' },
    { name: 'Mahadeva Amaranath',          role: '1st Patron',                   photo: '/committee/amaranath.jpg' },
    { name: 'Shuhar Yogar',                role: '2nd Patron',                   photo: '/committee/shuhar.jpg' },
    { name: 'Praba Thamotharampillai',     role: '3rd Patron',                   photo: '/committee/praba.jpg' },
    { name: 'Sutharshjan Sivarasa',        role: 'Secretary & Manager',          photo: '/committee/suthan.jpg' },
    { name: 'Navaratnam Ajanthan',         role: 'Treasurer',                    photo: '/committee/ajanthan.jpg' },
    { name: 'Ranjithraj Thurairajah',      role: 'Fixture Secretary',            photo: '/committee/ranjithraj.jpg' },
    { name: 'Roshan Thishanthan',          role: 'Captain',                      photo: '/committee/roshan.jpg' },
    { name: 'Gaajuran Ganagabalan',        role: 'Vice Captain',                 photo: '/committee/gaajuran.jpg' },
    { name: 'Arun Sri Rajendrarajah',      role: 'Executive Committee Member',   photo: '/committee/arun.jpg' },
    { name: 'Thanushan Sri Rajendrarajah', role: 'Executive Committee Member',   photo: '/committee/thanushan.jpg' },
  ],
  // NOTE: Personal mobile/email omitted — data protection. Contact via club email only.
  membership: [
    { name: 'Family Membership',  price: '£250', desc: 'For households — access to club events and facilities for two adults and children under 18.', image: '/membership/family.jpg' },
    { name: 'Adult Membership',   price: '£150', desc: 'Full access to matches, training sessions, and club events for the season.',                   image: '/membership/adult.jpg' },
    { name: 'Junior Membership',  price: '£100', desc: 'For young cricketers under 18 — coaching, match play, and youth-focused events.',              image: '/membership/junior.jpg' },
  ],
}
