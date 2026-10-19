// Central settings for the Globriefly site and agent.
// Change the name, URL, colours or categories here and everything else follows.

export const site = {
  name: 'Globriefly',
  tagline: 'The world, briefly.',
  description: 'Clear, fast coverage of the stories shaping the world — world news, politics, business, technology, science, health, sports and entertainment.',
  url: (process.env.SITE_URL || 'https://globriefly.com').replace(/\/$/, ''),
  facebookUrl: process.env.FACEBOOK_PAGE_URL || 'https://facebook.com',
  // Free newsletter form endpoint (e.g. Buttondown, MailerLite or Brevo form action URL). Leave empty to hide the form action.
  newsletterAction: process.env.NEXT_PUBLIC_NEWSLETTER_ACTION || '',
  // Contact form → your inbox, via Web3Forms (free). Get the key at https://web3forms.com by entering the
  // email address that should receive messages. The key is safe to make public: it can only send to that address.
  contactFormKey: process.env.NEXT_PUBLIC_WEB3FORMS_KEY || 'ddfb58df-7589-4a99-b40f-44716761b96a',
  // Sticky 300×600 ad on article pages. Point `src` at any HTML5 ad in public/ads/, or set it to '' to show
  // the empty slot for an AdSense unit instead.
  sidebarAd: { src: '/ads/visimatrix-300x600/', title: 'Advertisement: VisiMatrix' },
  colors: {
    ink: '#0E1116',
    red: '#E5142B',
    redText: '#C8102E',
    mist: '#F4F5F7',
  },
};

export const categories = [
  { slug: 'world', label: 'World', color: '#2563A8' },
  { slug: 'politics', label: 'Politics', color: '#6D4AA8' },
  { slug: 'business', label: 'Business', color: '#1A7F5A' },
  { slug: 'technology', label: 'Technology', color: '#0F7A8A' },
  { slug: 'science', label: 'Science', color: '#4652C8' },
  { slug: 'health', label: 'Health', color: '#C04A6C' },
  { slug: 'sports', label: 'Sports', color: '#B5520E' },
  { slug: 'entertainment', label: 'Entertainment', color: '#A63C9A' },
];

export const regions = ['Asia', 'Europe', 'Americas', 'Africa', 'Middle East', 'Oceania', 'Global'];

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
