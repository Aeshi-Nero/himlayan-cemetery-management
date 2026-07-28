import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowRight,
  Shield,
  MapPin,
  Clock,
  Heart,
  FileCheck,
  Compass,
  Users,
  CheckCircle,
  FileText,
  Camera,
  ZoomIn,
  Eye,
  X,
  ExternalLink,
  Sparkles,
  Trees,
  Globe,
  Send,
  Coffee,
  Car,
  Star,
  Quote,
  ChevronDown
} from 'lucide-react';
import { BlurText } from '../components/BlurText';
import { Navbar } from '../components/Navbar';
import { apiClient } from '../api/client';
import { getMapUsageCount, incrementMapUsageCount } from '../utils/mapUsageTracker';

// Cemetery Pictures
import cemeteryLawnImg from '../assets/images/cemetery_lawn_gardens_1784913858158.jpg';
import mausoleumImg from '../assets/images/mausoleum_architecture_1784913872418.jpg';
import pathwayImg from '../assets/images/memorial_pathway_1784913885130.jpg';
import terracesImg from '../assets/images/garden_terraces_1784913898287.jpg';
import chapelImg from '../assets/images/cemetery_chapel_gardens_1784913911911.jpg';
import flowerGardenImg from '../assets/images/peaceful_flower_garden_1784913922607.jpg';
import himlayanBackdropImg from '../assets/images/himlayan_hero_bg_top_text_1785132444974.jpg';
import cemeteryMemorialBgImg from '../assets/images/cemetery_memorial_bg_1784966447707.jpg';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  section: string;
  sectionCode: string;
  image: string;
  description: string;
  specs: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'lawn-gardens',
    title: 'North Lawn Gardens',
    category: 'Lawn Gardens',
    section: 'Section A',
    sectionCode: 'A',
    image: cemeteryLawnImg,
    description: 'Serene, manicured flat lawn plots with flush bronze markers surrounded by mature cypress trees and gentle morning sunlight.',
    specs: 'Single Lawn Plots • ₱15,000 per lot',
  },
  {
    id: 'mausoleums',
    title: 'East Family Mausoleum Estates',
    category: 'Mausoleums',
    section: 'Section B',
    sectionCode: 'B',
    image: mausoleumImg,
    description: 'Private family mausoleum structures with elegant marble craftsmanship, landscaped entryways, and granite pillars.',
    specs: 'Family Mausoleums • ₱35,000 per lot',
  },
  {
    id: 'pathways',
    title: 'Peaceful Memorial Pathways',
    category: 'Pathways & Gardens',
    section: 'Section C',
    sectionCode: 'C',
    image: pathwayImg,
    description: 'Shaded stone promenades with marble resting benches, offering direct turn-by-turn walking access from primary gates.',
    specs: 'Main Promenade • All Sections Access',
  },
  {
    id: 'terraces',
    title: 'Garden Wall Niche Terraces',
    category: 'Columbarium & Terraces',
    section: 'Section D',
    sectionCode: 'D',
    image: terracesImg,
    description: 'Elevated columbarium garden wall niches featuring brass memorial plaques and fresh flower arrangements.',
    specs: 'Garden Apartment Terraces • ₱60,000 per unit',
  },
  {
    id: 'chapel',
    title: 'Himlayan Memorial Sanctuary Chapel',
    category: 'Sanctuary & Grounds',
    section: 'Central Grounds',
    sectionCode: 'ALL',
    image: chapelImg,
    description: 'Quiet interfaith chapel and administrative sanctuary nestled among historic oak trees for family reflection.',
    specs: 'Central Grounds • Open Daily 6am - 6pm',
  },
  {
    id: 'fountain-garden',
    title: 'Reflective Memorial Garden & Fountain',
    category: 'Sanctuary & Grounds',
    section: 'East Wing',
    sectionCode: 'ALL',
    image: flowerGardenImg,
    description: 'Lush memorial garden with seasonal flowers, marble benches, and a peaceful water feature for meditation.',
    specs: 'East Wing • Public Visitor Resting Area',
  },
];

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden mb-4 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-bold font-heading text-slate-900">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-emerald-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-48 pb-4 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [mapUsageCount, setMapUsageCount] = useState<number>(15842);
  const [availablePlotsCount, setAvailablePlotsCount] = useState<number>(52);

  React.useEffect(() => {
    const loadUsage = async () => {
      const count = await getMapUsageCount();
      setMapUsageCount(count);
    };
    loadUsage();

    const fetchAvailablePlots = async () => {
      try {
        const res = await apiClient.get('/plots', { params: { status: 'available', limit: 100 } });
        if (res.data?.success && res.data?.pagination?.total !== undefined) {
          setAvailablePlotsCount(res.data.pagination.total);
        }
      } catch (err) {
        console.warn('Failed to fetch available plots count:', err);
      }
    };
    fetchAvailablePlots();

    const handleUpdate = (e: any) => {
      if (e.detail && typeof e.detail === 'number') {
        setMapUsageCount(e.detail);
      }
    };
    window.addEventListener('himlayan_map_usage_updated', handleUpdate);
    return () => window.removeEventListener('himlayan_map_usage_updated', handleUpdate);
  }, []);

  const handleNavigateToMap = async () => {
    await incrementMapUsageCount();
    navigate('/map');
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await incrementMapUsageCount();
    if (searchQuery.trim()) {
      navigate(`/lots?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/lots');
    }
  };

  const filteredGallery = activeCategory === 'ALL'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body selection:bg-emerald-700 selection:text-white">
      {/* Top Floating Navbar */}
      <Navbar />

      {/* SECTION 1: HERO */}
      <section className="relative min-h-[90vh] sm:min-h-[100vh] w-full overflow-hidden bg-emerald-950 flex flex-col items-center justify-start pt-56 sm:pt-64 md:pt-76 pb-16">
        {/* Backdrop Image Layer - Clean backdrop image with Himlayan title script */}
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: `url(${himlayanBackdropImg})`,
          }}
        />
        {/* Subtle bottom gradient to ensure text & controls contrast gracefully over lower background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-slate-950/90" />

        {/* Hero Content - Positioned directly below the Himlayan Calligraphy */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center justify-center mt-2 sm:mt-4 md:mt-6">
          {/* Subtitle / Tagline */}
          <BlurText
            text="Honoring Lives, Preserving Memories"
            className="text-3xl sm:text-5xl md:text-6xl font-heading italic font-bold text-white leading-[1.1] tracking-tight mb-4 drop-shadow-2xl"
            delay={0.2}
          />

          {/* Subtitle */}
          <motion.p
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-emerald-100/90 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed mb-8 drop-shadow"
          >
            Browse available memorial lots, explore interactive turn-by-turn pathfinding directions, submit burial inquiries, and access administrative records with dignity.
          </motion.p>

          {/* Search Bar Pill */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-full px-2 py-2 flex items-center gap-2 shadow-2xl border border-white/40 mb-8"
          >
            <Search className="w-5 h-5 text-emerald-800 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a love one..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-500 text-sm font-body focus:outline-none px-2 font-medium"
            />
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full p-3 font-semibold shadow-md transition-transform hover:scale-105 shrink-0 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>

          {/* Quick Nav Pills */}
          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            <button
              onClick={() => navigate('/lots')}
              className="bg-slate-900/80 hover:bg-slate-900 text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-lg border border-slate-700/80 flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md hover:scale-105"
            >
              <span>Browse Memorial Lots</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              onClick={handleNavigateToMap}
              className="bg-emerald-800/90 hover:bg-emerald-700 text-white rounded-full px-5 py-2.5 text-xs font-semibold border border-emerald-600/80 flex items-center gap-2 transition-all cursor-pointer shadow-lg backdrop-blur-md hover:scale-105"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>View Interactive Map</span>
            </button>
          </motion.div>

          {/* Bottom Trust Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
          >
            <span className="bg-slate-900/80 backdrop-blur-md rounded-full px-6 py-2.5 text-[11px] text-emerald-300 font-bold tracking-widest uppercase border border-slate-700/80 shadow-xl">
              Serving Families with Integrity & Dignity
            </span>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: MISSION */}
      <section className="py-20 bg-white text-slate-900 border-y border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-200 uppercase tracking-widest">
              Our Mission
            </span>
            <BlurText
              text="Modernizing Memorial Services with Clarity"
              className="text-3xl sm:text-5xl font-heading italic font-bold text-slate-900 mt-4 mb-4"
            />
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Himlayan Memorial Park combines sacred tradition with modern digital mapping, contract workflows, and public transparency.
            </p>
          </div>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: mapUsageCount.toLocaleString(),
                label: 'Total Map Users Worldwide',
                desc: 'Visitors and families worldwide who have accessed and navigated Himlayan Memorial Park\'s interactive digital map.',
                isLiveCounter: true,
              },
              {
                number: `${availablePlotsCount}`,
                label: 'Current Available Plots',
                desc: 'Unreserved memorial lots ready for family purchase across Sections A, B, C, and D.',
              },
              {
                number: '24/7',
                label: 'Public Accessibility',
                desc: 'Instant search, cemetery status records, and digital inquiry submission.',
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
                whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, delay: idx * 0.15 }}
                className="bg-slate-50 rounded-2xl p-8 min-h-[180px] hover:shadow-lg transition-all duration-300 border border-slate-200"
              >
                <div className="text-4xl sm:text-5xl font-heading italic font-bold text-emerald-700 mb-2 overflow-hidden">
                  {stat.isLiveCounter ? (
                    <motion.span
                      key={mapUsageCount}
                      initial={{ scale: 1.35, y: -6, color: '#059669' }}
                      animate={{ scale: 1, y: 0, color: '#047857' }}
                      transition={{ duration: 0.5, type: 'spring', stiffness: 350, damping: 20 }}
                      className="inline-block"
                    >
                      {mapUsageCount.toLocaleString()}
                    </motion.span>
                  ) : (
                    stat.number
                  )}
                </div>
                <div className="text-xs font-bold font-body uppercase tracking-wider text-slate-800 mb-2">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-600 leading-relaxed font-normal">
                  {stat.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY SECTION: CEMETERY GROUNDS & ARCHITECTURE */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="bg-emerald-950 text-emerald-400 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-800 uppercase tracking-widest inline-flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Memorial Grounds Gallery</span>
            </span>
            <BlurText
              text="Explore Our Serene Cemetery Grounds"
              className="text-3xl sm:text-5xl font-heading italic font-bold text-white mt-4 mb-4"
            />
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Hover over any picture to reveal section details, architecture descriptions, and pricing specifications. Click to inspect high-resolution grounds views.
            </p>

            {/* Filter Category Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {[
                { label: 'All Grounds', value: 'ALL' },
                { label: 'Lawn Gardens', value: 'Lawn Gardens' },
                { label: 'Mausoleums', value: 'Mausoleums' },
                { label: 'Pathways & Gardens', value: 'Pathways & Gardens' },
                { label: 'Columbarium & Terraces', value: 'Columbarium & Terraces' },
                { label: 'Sanctuary & Grounds', value: 'Sanctuary & Grounds' },
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeCategory === cat.value
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hoverable Pictures Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedGalleryItem(item)}
                className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl cursor-pointer hover:border-emerald-500/60 transition-all duration-300"
              >
                {/* Image Container with Zoom Effect */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                  />

                  {/* Always Visible Top Badge */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                      <Trees className="w-3 h-3" />
                      <span>{item.section}</span>
                    </span>
                  </div>

                  {/* Always Visible Category Pill (Right Top) */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-emerald-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-600/40">
                      {item.category}
                    </span>
                  </div>

                  {/* Dark Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-0 group-hover:opacity-95 transition-opacity duration-300 flex flex-col justify-end p-5 z-20">
                    {/* Centered Zoom Icon */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                        <ZoomIn className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Sliding Content */}
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">
                        {item.specs}
                      </span>
                      <h3 className="text-lg font-heading italic font-bold text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <span>Click to view full grounds preview</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Permanent Caption */}
                <div className="p-4 bg-slate-900/90 flex items-center justify-between border-t border-slate-800/80">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {item.specs}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section className="py-20 bg-slate-50 text-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-200 uppercase tracking-widest">
              Core Capabilities
            </span>
            <BlurText
              text="Comprehensive Tools for Families & Staff"
              className="text-3xl sm:text-5xl font-heading italic font-bold text-slate-900 mt-4 mb-4"
            />
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Designed to satisfy the highest administrative standards while offering seamless access to the general public.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: 'Interactive Plot Map',
                desc: 'Color-coded plot markers (Available, Reserved, Occupied, Full) with real-time detail popups.',
              },
              {
                icon: Compass,
                title: 'Pathfinding Directions',
                desc: 'Calculates the exact shortest path from cemetery entry gates to specific memorial lots.',
              },
              {
                icon: FileText,
                title: 'Digital Public Inquiry',
                desc: 'Easy online submission form for lot reservation requests, pricing queries, and assistance.',
              },
              {
                icon: CheckCircle,
                title: 'Deceased Records Directory',
                desc: 'Search burial logs, section allocations, and official internment records.',
              },
              {
                icon: FileCheck,
                title: 'Contract & Payment Ledger',
                desc: 'Role-based workflows for RCC clerks to generate contracts, log payments, and issue receipts.',
              },
              {
                icon: Shield,
                title: 'Role-Based Access Control',
                desc: 'Strict authorization levels for Super Admin, RCC Clerks, Engineers, and Field Staff.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
                  whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className="bg-white rounded-2xl p-6 hover:shadow-md transition-all duration-300 border border-slate-200/80"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section className="py-20 bg-white text-slate-900 border-t border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-200 uppercase tracking-widest">
              Simple Step-by-Step
            </span>
            <BlurText
              text="How Himlayan Service Works"
              className="text-3xl sm:text-5xl font-heading italic font-bold text-slate-900 mt-4 mb-4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Browse & Select Memorial Lot',
                desc: 'Search our database of Lawn, Mausoleum, and Terrace lots across Sections A-D with transparent pricing.',
                image: cemeteryLawnImg
              },
              {
                step: '02',
                title: 'Submit Inquiry or Reservation',
                desc: 'Fill out a quick digital inquiry form or visit our administration office for reservation steps.',
                image: mausoleumImg
              },
              {
                step: '03',
                title: 'Navigate & Visit with Map',
                desc: 'Access interactive maps on your smartphone for turn-by-turn walking directions straight to the lot.',
                image: pathwayImg
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
                whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, delay: idx * 0.15 }}
                className="bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                <div className="h-48 overflow-hidden relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-black font-heading shadow-md">
                    {item.step}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-center">
                  <h3 className="text-xl font-bold font-heading text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4.5: AMENITIES */}
      <section className="py-20 bg-slate-50 text-slate-900 border-t border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-200 uppercase tracking-widest">
              Park Amenities
            </span>
            <BlurText
              text="Facilities for Your Comfort"
              className="text-3xl sm:text-5xl font-heading italic font-bold text-slate-900 mt-4 mb-4"
            />
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We provide essential facilities to ensure that every visit is comfortable, peaceful, and secure for all families and guests.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Car,
                title: 'Ample Parking',
                desc: 'Spacious and secure parking areas located near all major sections.',
                image: cemeteryMemorialBgImg
              },
              {
                icon: Shield,
                title: '24/7 Security',
                desc: 'Round-the-clock security personnel and surveillance for your safety.',
                image: terracesImg
              },
              {
                icon: Heart,
                title: 'Interfaith Chapel',
                desc: 'A quiet sanctuary open to all faiths for prayer and reflection.',
                image: chapelImg
              },
              {
                icon: Coffee,
                title: 'Rest Areas',
                desc: 'Shaded gazebos and comfortable seating areas across the park grounds.',
                image: flowerGardenImg
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors"></div>
                    <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-emerald-700 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="p-6 text-center flex-1">
                    <h3 className="text-lg font-bold font-heading text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4.6: TESTIMONIALS */}
      <section className="py-20 bg-white text-slate-900 border-t border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-200 uppercase tracking-widest">
              Families We've Served
            </span>
            <BlurText
              text="Words of Comfort"
              className="text-3xl sm:text-5xl font-heading italic font-bold text-slate-900 mt-4 mb-4"
            />
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We take pride in providing a dignified and serene resting place for your loved ones, supported by compassionate service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "Himlayan Memorial Park has provided our family with so much peace. The grounds are always immaculately kept, and the staff treated us with the utmost respect during our most difficult time.",
                author: "Maria Santos",
                role: "Family Representative"
              },
              {
                text: "The interactive map is a lifesaver. We have older relatives who find it hard to walk around, and being able to find the exact plot and the shortest path beforehand made our All Souls' Day visit stress-free.",
                author: "Antonio Reyes",
                role: "Visitor"
              },
              {
                text: "Securing a family mausoleum lot was seamless. The administration was transparent with the pricing, and the location in the East Wing is truly beautiful and peaceful.",
                author: "Elena Cruz",
                role: "Lot Owner"
              }
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, delay: idx * 0.15 }}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-200 relative"
              >
                <Quote className="absolute top-6 right-6 w-10 h-10 text-emerald-100" />
                <div className="flex gap-1 mb-4 text-emerald-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-6 italic relative z-10">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-bold font-heading text-slate-900">{testimonial.author}</p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4.7: FAQ */}
      <section className="py-20 bg-slate-50 text-slate-900 border-t border-slate-200 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-200 uppercase tracking-widest">
              Got Questions?
            </span>
            <BlurText
              text="Frequently Asked Questions"
              className="text-3xl sm:text-5xl font-heading italic font-bold text-slate-900 mt-4 mb-4"
            />
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="What are the visiting hours of the cemetery?" 
              answer="Himlayan Memorial Park is open to visitors daily from 6:00 AM to 6:00 PM. The administrative office is open from 8:00 AM to 5:00 PM, Monday through Saturday." 
            />
            <FAQItem 
              question="How do I purchase a memorial lot?" 
              answer="You can begin the process by browsing our available lots on the interactive map. Once you find a preferred lot, you can submit an inquiry through our website, or visit our administration office to speak with a counselor who will guide you through the payment and contracting process." 
            />
            <FAQItem 
              question="Are there maintenance fees for the lots?" 
              answer="Yes, a perpetual care fund contribution is included in the purchase price to ensure the continuous maintenance of the lawn, pathways, and common areas. No monthly maintenance fees will be collected thereafter." 
            />
            <FAQItem 
              question="Can we design our own mausoleum?" 
              answer="Yes, for Family Mausoleum lots, families may hire their own contractors and architects. However, all designs must be submitted to the park's engineering office for review to ensure they comply with our height and structural guidelines." 
            />
          </div>
        </div>
      </section>

      {/* SECTION 5: WHY HIMLAYAN (CTA) */}
      <section className="relative py-24 bg-emerald-950 text-white text-center overflow-hidden">
        {/* Cemetery Memorial Photo Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={cemeteryMemorialBgImg}
            alt="Himlayan Memorial Park Cemetery Background"
            className="w-full h-full object-cover filter blur-md scale-105 opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-900/65 to-emerald-950/85" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <span className="bg-emerald-800 text-emerald-100 rounded-full px-4 py-1.5 text-xs font-bold border border-emerald-700 uppercase tracking-widest mb-4 inline-block">
            Why Himlayan
          </span>
          <BlurText
            text="Built to Serve Families & Community"
            className="text-3xl sm:text-6xl font-heading italic font-bold text-white mb-6"
          />
          <p className="text-emerald-100 text-sm sm:text-base max-w-2xl mx-auto mb-10 font-normal">
            Providing peace of mind through organized digital records, respectful cemetery maintenance, and open public mapping.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/lots')}
              className="bg-white text-emerald-950 hover:bg-slate-100 rounded-full px-8 py-4 font-bold shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              Browse Memorial Lots
            </button>
            <button
              onClick={handleNavigateToMap}
              className="bg-emerald-800 hover:bg-emerald-700 text-white rounded-full px-8 py-4 font-bold border border-emerald-600 transition-all cursor-pointer"
            >
              View Interactive Map
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6: NEWSLETTER / QUICK INQUIRY */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-800/30 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-2xl sm:text-4xl font-heading italic font-bold text-white mb-4">
                Stay Updated or Request Info
              </h2>
              <p className="text-emerald-100/80 text-sm sm:text-base max-w-2xl mx-auto mb-8 font-normal">
                Join our newsletter for park updates, community events, or submit your email to request an official pricing brochure.
              </p>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for subscribing! We will send updates to your email.');
                }} 
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              >
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  required
                  className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 sm:py-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer"
                >
                  <span>Subscribe</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-slate-400 text-[10px] mt-4">
                We respect your privacy. No spam, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED BLACK FOOTER */}
      <footer className="bg-slate-950 text-slate-300 py-16 sm:py-20 border-t border-slate-900 font-body relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-800/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Trees className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="font-heading italic font-bold text-xl tracking-wide">Himlayan</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                A serene resting place providing comprehensive memorial services, meticulous groundskeeping, and dignified care for your loved ones.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors text-slate-400">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors text-slate-400">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-heading font-bold mb-6 tracking-wide uppercase text-sm">Quick Links</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Home</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Interactive Map</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Memorial Lots</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Inquiry Form</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Login / Portal</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-heading font-bold mb-6 tracking-wide uppercase text-sm">Our Services</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Lot Reservations</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Internment Scheduling</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Mausoleum Guidelines</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Perpetual Care Fund</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">Grief Support Directory</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-heading font-bold mb-6 tracking-wide uppercase text-sm">Contact Office</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-400">
                  <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>123 Memorial Drive, Serenity Park, Quezon City, Philippines</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-400">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span>(02) 8-123-4567</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-400">
                  <Send className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>info@himlayanpark.com</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2026 Himlayan Cemetery Management System. All Rights Reserved.
            </p>
            <div className="flex gap-6 text-xs text-slate-500">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL PREVIEW FOR CEMETERY PICTURES */}
      <AnimatePresence>
        {selectedGalleryItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedGalleryItem(null)}
                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Image View */}
              <div className="relative aspect-[16/9] w-full bg-slate-950">
                <img
                  src={selectedGalleryItem.image}
                  alt={selectedGalleryItem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {selectedGalleryItem.section}
                  </span>
                  <span className="bg-slate-900/90 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/40">
                    {selectedGalleryItem.category}
                  </span>
                </div>
              </div>

              {/* Detail Info */}
              <div className="p-6 sm:p-8 space-y-4 bg-slate-900">
                <div>
                  <h3 className="text-2xl font-heading italic font-bold text-white mb-1">
                    {selectedGalleryItem.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    {selectedGalleryItem.specs}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedGalleryItem.description}
                </p>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      const sec = selectedGalleryItem.sectionCode;
                      setSelectedGalleryItem(null);
                      if (sec !== 'ALL') {
                        navigate(`/lots?section=${sec}`);
                      } else {
                        navigate('/lots');
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Browse Plots in {selectedGalleryItem.section}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGalleryItem(null);
                      navigate('/map');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-3 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>View Map Location</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
