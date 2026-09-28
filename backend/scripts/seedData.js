const { Types } = require('mongoose');

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const rupees = (n) => n * 100; // stored in paise

const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
const portrait = (gender, n) => `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

function buildSeed(now = new Date()) {
  const at = (offsetMs) => new Date(now.getTime() + offsetMs);
  const id = () => new Types.ObjectId();

  const demoUsers = [
    { _id: id(), name: 'Aditi Sharma', email: 'aditi@demo.feedants.com', avatarUrl: portrait('women', 65), referralCode: 'referral123', isDemo: true },
    { _id: id(), name: 'Rahul Mehta', email: 'rahul@demo.feedants.com', avatarUrl: portrait('men', 32), referralCode: 'rahul2026', isDemo: true },
    { _id: id(), name: 'Sneha Iyer', email: 'sneha@demo.feedants.com', avatarUrl: portrait('women', 12), referralCode: 'sneha2026', isDemo: true },
  ];
  const crowd = Array.from({ length: 20 }, (_, i) => ({
    _id: id(),
    name: `Participant ${i + 1}`,
    email: `participant${i + 1}@demo.feedants.com`,
    referralCode: `crowd${String(i + 1).padStart(3, '0')}`,
  }));
  const [aditi] = demoUsers;

  const judge = {
    name: 'Manju Dubey',
    title: { en: 'Professional Kathak Dancer', hi: 'पेशेवर कथक नृत्यांगना' },
    experienceYears: 12,
    photoUrl: portrait('women', 44),
    introVideoUrl: SAMPLE_VIDEO,
  };

  const previousWinners = [
    { name: 'Riya Shah', position: 1, thumbnailUrl: portrait('women', 68), videoUrl: SAMPLE_VIDEO },
    { name: 'Aarav Mehta', position: 1, thumbnailUrl: portrait('men', 75), videoUrl: SAMPLE_VIDEO },
    { name: 'Neha Verma', position: 2, thumbnailUrl: portrait('women', 90), videoUrl: SAMPLE_VIDEO },
    { name: 'Ishita Chopra', position: 3, thumbnailUrl: portrait('women', 26), videoUrl: SAMPLE_VIDEO },
  ];

  const base = {
    status: 'published',
    category: { en: 'Dance', hi: 'नृत्य' },
    tags: [{ en: 'Multi-Win', hi: 'मल्टी-विन' }],
    awardsCertificate: true,
    currency: 'INR',
    prizePool: rupees(1500),
    entryFee: rupees(99),
    capacity: 20,
    judge,
    previousWinners,
    about: {
      en: [
        'This is an online classical dance competition open for all age groups.',
        'Participate from anywhere and showcase your talent.',
        'Express your passion through traditional dance.',
        'Record a solo performance of 2–5 minutes in any Indian classical style — Kathak, Bharatanatyam, Odissi, Kuchipudi, Manipuri or Mohiniyattam.',
        'Our judge reviews every paid entry and shares feedback with the top performers.',
      ].join('\n'),
      hi: [
        'यह सभी आयु वर्गों के लिए एक ऑनलाइन शास्त्रीय नृत्य प्रतियोगिता है।',
        'कहीं से भी भाग लें और अपनी प्रतिभा दिखाएँ।',
        'पारंपरिक नृत्य के माध्यम से अपने जुनून को व्यक्त करें।',
        'किसी भी भारतीय शास्त्रीय शैली में 2–5 मिनट का एकल प्रदर्शन रिकॉर्ड करें — कथक, भरतनाट्यम, ओडिसी, कुचिपुड़ी, मणिपुरी या मोहिनीअट्टम।',
        'हमारे निर्णायक हर सशुल्क प्रविष्टि की समीक्षा करते हैं और शीर्ष प्रतिभागियों को प्रतिक्रिया देते हैं।',
      ].join('\n'),
    },
    judgingParameters: [
      { en: 'Technique & footwork (30%)', hi: 'तकनीक और पदचालन (30%)' },
      { en: 'Expression / Abhinaya (25%)', hi: 'भाव / अभिनय (25%)' },
      { en: 'Rhythm & Laya (20%)', hi: 'ताल और लय (20%)' },
      { en: 'Choreography & creativity (15%)', hi: 'नृत्य संरचना और रचनात्मकता (15%)' },
      { en: 'Costume & presentation (10%)', hi: 'वेशभूषा और प्रस्तुति (10%)' },
    ],
    rules: [
      { en: 'Open to participants of all ages. Minors need guardian consent.', hi: 'सभी आयु के प्रतिभागियों के लिए खुला। नाबालिगों के लिए अभिभावक की सहमति आवश्यक।' },
      { en: 'One solo video per participant, 2–5 minutes long.', hi: 'प्रति प्रतिभागी एक एकल वीडियो, 2–5 मिनट लंबा।' },
      { en: 'Video must be unedited, recorded in a single take.', hi: 'वीडियो बिना संपादन के, एक ही टेक में रिकॉर्ड होना चाहिए।' },
      { en: 'Only contributions from paid participants are judged.', hi: 'केवल सशुल्क प्रतिभागियों की प्रविष्टियों का मूल्यांकन होगा।' },
      { en: "The judge's decision is final.", hi: 'निर्णायक का निर्णय अंतिम होगा।' },
    ],
    rewards: [
      { position: 1, amount: rupees(550) },
      { position: 2, amount: rupees(300) },
      { position: 3, amount: rupees(240) },
      { position: 4, amount: rupees(200) },
      { position: 5, amount: rupees(130) },
      { position: 6, amount: rupees(80) },
    ],
    disclaimer: {
      en: 'Only contributions from paid participants will be considered for judging.',
      hi: 'केवल सशुल्क प्रतिभागियों की प्रविष्टियों पर ही निर्णय के लिए विचार किया जाएगा।',
    },
    prizeInfoVideoUrl: SAMPLE_VIDEO,
    refundPolicyUrl: 'https://feedants.com/refund-policy',
    paymentProvider: 'Razorpay',
    referralRewardPerSignup: rupees(10),
  };

  // Mirrors the design: registration closes in 01d 06h 28m 32s and submissions already opened.
  const regCloses = at(1 * DAY + 6 * HOUR + 28 * MIN + 32_000);
  const designSchedule = {
    registrationOpensAt: at(-20 * DAY),
    registrationClosesAt: regCloses,
    submissionStartsAt: new Date(regCloses.getTime() - (4 * DAY + 19 * HOUR + 50 * MIN)),
    submissionEndsAt: new Date(regCloses.getTime() + 20 * DAY + 5 * MIN),
    resultAt: new Date(regCloses.getTime() + 22 * DAY),
  };

  const competitions = [
    {
      ...base,
      _id: id(),
      slug: 'feedants-classical-dance',
      title: { en: 'Feedants Classical Dance', hi: 'फीडेंट्स शास्त्रीय नृत्य' },
      schedule: designSchedule,
    },
    {
      ...base,
      _id: id(),
      slug: 'feedants-folk-dance',
      title: { en: 'Feedants Folk Dance', hi: 'फीडेंट्स लोक नृत्य' },
      schedule: { ...designSchedule, registrationClosesAt: at(3 * DAY) },
    },
    {
      ...base,
      _id: id(),
      slug: 'feedants-bharatanatyam-championship',
      title: { en: 'Bharatanatyam Championship', hi: 'भरतनाट्यम चैंपियनशिप' },
      prizePool: rupees(5000),
      entryFee: rupees(149),
      capacity: 50,
      rewards: [
        { position: 1, amount: rupees(2500) },
        { position: 2, amount: rupees(1500) },
        { position: 3, amount: rupees(1000) },
      ],
      schedule: {
        registrationOpensAt: at(2 * DAY),
        registrationClosesAt: at(12 * DAY),
        submissionStartsAt: at(10 * DAY),
        submissionEndsAt: at(20 * DAY),
        resultAt: at(25 * DAY),
      },
    },
    {
      ...base,
      _id: id(),
      slug: 'feedants-kathak-showcase',
      title: { en: 'Kathak Showcase', hi: 'कथक शोकेस' },
      schedule: {
        registrationOpensAt: at(-30 * DAY),
        registrationClosesAt: at(-10 * DAY),
        submissionStartsAt: at(-15 * DAY),
        submissionEndsAt: at(-1 * DAY),
        resultAt: at(3 * DAY),
      },
    },
    {
      ...base,
      _id: id(),
      slug: 'feedants-semi-classical-cup',
      title: { en: 'Semi-Classical Cup', hi: 'सेमी-क्लासिकल कप' },
      schedule: {
        registrationOpensAt: at(-60 * DAY),
        registrationClosesAt: at(-40 * DAY),
        submissionStartsAt: at(-45 * DAY),
        submissionEndsAt: at(-20 * DAY),
        resultAt: at(-15 * DAY),
      },
    },
    {
      ...base,
      _id: id(),
      slug: 'feedants-free-dance-jam',
      title: { en: 'Free Dance Jam', hi: 'फ्री डांस जैम' },
      tags: [{ en: 'Free Entry', hi: 'निःशुल्क प्रवेश' }],
      awardsCertificate: false,
      entryFee: 0,
      prizePool: rupees(500),
      capacity: 5,
      rewards: [
        { position: 1, amount: rupees(300) },
        { position: 2, amount: rupees(200) },
      ],
      schedule: designSchedule,
    },
  ];
  const [classical, folk, , kathak, semi] = competitions;

  const confirmed = (competition, user, daysAgo = 5) => ({
    _id: id(),
    competition: competition._id,
    user: user._id,
    status: 'confirmed',
    amount: competition.entryFee,
    currency: 'INR',
    confirmedAt: at(-daysAgo * DAY),
    payment: { provider: 'mock', orderId: `order_seed_${user._id}`, paymentId: `pay_seed_${user._id}`, paidAt: at(-daysAgo * DAY) },
  });

  const registrations = [
    confirmed(classical, aditi),
    ...crowd.map((u) => confirmed(folk, u)), // sold out: 20 / 20
    confirmed(kathak, aditi, 20),
    confirmed(semi, aditi, 50),
  ];

  const submissions = [
    {
      _id: id(),
      competition: kathak._id,
      user: aditi._id,
      registration: registrations.find((r) => r.competition === kathak._id)._id,
      fileUrl: SAMPLE_VIDEO,
      originalName: 'kathak-performance.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 12_400_000,
      revision: 1,
    },
  ];

  for (const c of competitions) {
    c.spotsTaken = registrations.filter((r) => r.competition === c._id).length;
  }

  const testimonials = [
    { name: 'Kavya N.', avatarUrl: portrait('women', 33), rating: 5, quote: { en: 'The judge feedback helped me improve my abhinaya so much!', hi: 'निर्णायक की प्रतिक्रिया से मेरे अभिनय में बहुत सुधार हुआ!' } },
    { name: 'Arjun P.', avatarUrl: portrait('men', 45), rating: 5, quote: { en: 'Smooth registration and the prize reached my account within a week.', hi: 'पंजीकरण आसान था और पुरस्कार एक सप्ताह में मेरे खाते में आ गया।' } },
    { name: 'Meera S.', avatarUrl: portrait('women', 52), rating: 4, quote: { en: 'Loved competing from home. Great way to get noticed.', hi: 'घर से प्रतियोगिता करना बहुत अच्छा लगा। पहचान पाने का शानदार तरीका।' } },
  ];

  return { users: [...demoUsers, ...crowd.map((u) => ({ ...u, isDemo: false }))], competitions, registrations, submissions, testimonials };
}

module.exports = { buildSeed };
