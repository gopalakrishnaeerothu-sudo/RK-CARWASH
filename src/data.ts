// All business content lives here. Edit this file to change text, contact details or photos.

export const business = {
  name: 'R.K CAR WASH',
  owner: 'Krishnam Raju',
  tagline: 'We wash. You shine.',
  phone: '9676467987',
  phoneIntl: '+919676467987',
  instagram: 'https://www.instagram.com/krishnamrajukshatriyas',
  instagramHandle: '@krishnamrajukshatriyas',
};

const waText = 'Hello R.K CAR WASH, I would like to enquire about your vehicle washing services.';
export const links = {
  call: `tel:${business.phoneIntl}`,
  whatsapp: `https://wa.me/919676467987?text=${encodeURIComponent(waText)}`,
  whatsappLocation: `https://wa.me/919676467987?text=${encodeURIComponent(
    'Hello R.K CAR WASH, could you please share your location and timings?',
  )}`,
};

export const nav = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'work', label: 'Our Work' },
  { id: 'contact', label: 'Contact' },
];

/** Hotspots on the hero image. x/y are percentages of the image, not the screen. */
export type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  title: [string, string];
  description: string;
  parts: { name: string; text: string }[];
  benefit: string;
};

export const hotspots: Hotspot[] = [
  {
    id: 'pressure',
    label: 'High-pressure clean',
    x: 55,
    y: 29,
    title: ['High-pressure', 'clean.'],
    description:
      'A focused jet of water lifts stubborn dirt from the roof, glass and panels without scrubbing it into the paint.',
    parts: [
      { name: 'Roof & glass', text: 'Dust and bird droppings are loosened and carried away from the top down.' },
      { name: 'Panels', text: 'Water pressure clears the grime that settles along doors and body lines.' },
      { name: 'Gaps & edges', text: 'The jet reaches mirror bases, grilles and trims that a cloth misses.' },
    ],
    benefit: 'Dirt leaves the surface with water, not with hard rubbing.',
  },
  {
    id: 'foam',
    label: 'Foam wash',
    x: 30,
    y: 41,
    title: ['Rich foam,', 'every panel.'],
    description:
      'A thick layer of foam covers the vehicle and softens road film, so the rinse can carry it away cleanly.',
    parts: [
      { name: 'Bonnet', text: 'Foam clings to the bonnet and loosens the dust and insects collected on the road.' },
      { name: 'Body', text: 'Every panel is covered, from the front bumper to the rear.' },
      { name: 'Dwell time', text: 'The foam is given time to work before rinsing begins.' },
    ],
    benefit: 'Softened dirt rinses away more easily.',
  },
  {
    id: 'wheels',
    label: 'Wheels & arches',
    x: 52,
    y: 53,
    title: ['Wheels', '& arches.'],
    description:
      'Mud and brake dust gather around the wheels first. They get their own attention before the final rinse.',
    parts: [
      { name: 'Tyres', text: 'Mud and road dirt are washed from the tyre walls.' },
      { name: 'Rims', text: 'Brake dust is cleared from the spokes and rim edges.' },
      { name: 'Wheel arches', text: 'Caked mud inside the arches is sprayed out.' },
    ],
    benefit: 'Clean wheels make the whole vehicle look fresh.',
  },
  {
    id: 'shine',
    label: 'Final shine',
    x: 43,
    y: 45,
    title: ['Rinse', '& final shine.'],
    description:
      'A clean-water rinse removes the last of the foam, leaving the paint, lights and glass bright again.',
    parts: [
      { name: 'Headlights', text: 'Lamps are rinsed clear of film and grime.' },
      { name: 'Paint', text: 'Every trace of foam is rinsed away from the bodywork.' },
      { name: 'Hand-over', text: 'Your vehicle goes back to you clean, fresh and shining.' },
    ],
    benefit: 'You drive away in a vehicle that looks cared for.',
  },
];

export const vehicleNotes = [
  { title: 'Cars & SUVs', text: 'Hatchbacks, sedans and SUVs washed panel by panel.' },
  { title: 'Bikes & scooters', text: 'Motorcycles and scooters cleaned of mud, dust and chain grime.' },
  { title: 'Lorries & heavy vehicles', text: 'Lorries and trucks — big wheels, tall cabins and long bodies.' },
  { title: 'Commercial vehicles', text: 'Autos, vans and goods carriers washed so they can get back to work.' },
];

export type Service = { name: string; text: string; icon: string };
export const services: Service[] = [
  { name: 'Car Washing', text: 'Complete exterior wash for hatchbacks and sedans.', icon: 'car' },
  { name: 'Bike Washing', text: 'Motorcycles and scooters, wheels to tank.', icon: 'bike' },
  { name: 'Lorry & Heavy Vehicle Washing', text: 'Lorries, trucks and other heavy vehicles.', icon: 'truck' },
  { name: 'SUV Washing', text: 'Taller bodies and bigger wheels, fully covered.', icon: 'suv' },
  { name: 'Commercial Vehicle Washing', text: 'Autos, vans and goods carriers.', icon: 'bus' },
  { name: 'Exterior Cleaning', text: 'Body, glass, lights and trims washed clean.', icon: 'sparkles' },
  { name: 'Foam Washing', text: 'A rich foam layer that softens road dirt.', icon: 'foam' },
  { name: 'Vehicle Rinsing', text: 'High-pressure water rinse for a quick refresh.', icon: 'droplets' },
];

export const steps = [
  { no: '01', title: 'Pre-wash', text: 'Removing dust, mud and loose dirt.', img: '/img/promo-suv.webp', pos: '30% 50%' },
  { no: '02', title: 'Foam wash', text: 'Applying rich foam across the vehicle.', img: '/img/promo-foam.webp', pos: '40% 55%' },
  { no: '03', title: 'High-pressure clean', text: 'Removing stubborn dirt using water pressure.', img: '/img/promo-red-car.webp', pos: '55% 40%' },
  { no: '04', title: 'Rinse & clean', text: 'Washing away remaining foam and dirt.', img: '/img/promo-suv.webp', pos: '60% 70%' },
  { no: '05', title: 'Final shine', text: 'Presenting a clean, fresh-looking vehicle.', img: '/img/promo-red-car.webp', pos: '32% 45%' },
];

/**
 * Gallery. `kind: 'photo'` = a real photograph; `kind: 'promo'` = promotional visual,
 * always labelled as such on the page. Add real work photos to public/img/ and list them
 * here with category 'Cars' | 'Bikes' | 'Lorries' | 'Others' — filters appear automatically.
 */
export type GalleryItem = {
  src: string;
  alt: string;
  category: 'Cars' | 'Bikes' | 'Lorries' | 'Others' | 'Owner' | 'Promotional';
  kind: 'photo' | 'promo';
  w: number;
  h: number;
};
export const gallery: GalleryItem[] = [
  { src: '/img/owner-car.webp', alt: 'Krishnam Raju, owner of R.K CAR WASH, leaning on a white Hyundai hatchback', category: 'Owner', kind: 'photo', w: 584, h: 866 },
  { src: '/img/promo-red-car.webp', alt: 'Promotional visual: a worker rinsing a red sports car with a pressure washer', category: 'Promotional', kind: 'promo', w: 800, h: 533 },
  { src: '/img/owner-portrait.webp', alt: 'Krishnam Raju in an orange shirt, standing against a granite wall', category: 'Owner', kind: 'photo', w: 598, h: 868 },
  { src: '/img/promo-foam.webp', alt: 'Promotional visual: a silver sedan covered in foam inside a wash bay', category: 'Promotional', kind: 'promo', w: 1024, h: 1024 },
  { src: '/img/owner-event.webp', alt: 'Krishnam Raju smiling at an event', category: 'Owner', kind: 'photo', w: 597, h: 865 },
  { src: '/img/promo-suv.webp', alt: 'Promotional visual: a black SUV front bumper being pressure-washed', category: 'Promotional', kind: 'promo', w: 1536, h: 1024 },
];

export const promos = [
  { src: '/img/promo-suv.webp', title: 'Pressure. Precision.', text: 'A black SUV takes the jet head-on.' },
  { src: '/img/promo-foam.webp', title: 'Foam that works.', text: 'Every panel covered before the rinse.' },
  { src: '/img/promo-red-car.webp', title: 'Back to shine.', text: 'The final rinse, under studio light.' },
];

export const reasons = [
  { title: 'Passionate workmanship', text: 'Washing vehicles is the owner’s passion, not a side job.', icon: 'heart' },
  { title: 'Every vehicle category', text: 'Bikes, cars, SUVs, lorries and commercial vehicles.', icon: 'layers' },
  { title: 'A dedicated process', text: 'Pre-wash, foam, pressure, rinse and shine — in order.', icon: 'list' },
  { title: 'Attention to cleanliness', text: 'Wheels, arches, glass and trims are not skipped.', icon: 'sparkles' },
  { title: 'Customer-focused', text: 'Call or WhatsApp the owner directly.', icon: 'user' },
  { title: 'Heavy-vehicle capable', text: 'Lorries and heavy vehicles are washed too.', icon: 'truck' },
];
