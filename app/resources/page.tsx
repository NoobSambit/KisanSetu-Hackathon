/**
 * Resources / Knowledge Page
 *
 * Displays structured farming knowledge organized by category.
 */

import Container from '@/components/ui/Container';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

import {
  Wheat,
  Sprout,
  Calendar,
  Layers,
  TestTube,
  Pill,
  Landmark,
  ShieldCheck,
  Banknote,
  ShieldAlert,
  Recycle,
  Globe,
  Search
} from 'lucide-react';

interface Resource {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const resources: Resource[] = [
  // Crop Basics
  {
    id: 'crop-1',
    category: 'Crop Basics',
    icon: <Wheat className="w-6 h-6 text-yellow-600" />,
    title: 'Choosing the Right Crops',
    description: 'Learn how to select crops based on your soil type, climate, water availability, and market demand.',
  },
  {
    id: 'crop-2',
    category: 'Crop Basics',
    icon: <Sprout className="w-6 h-6 text-green-600" />,
    title: 'Seed Selection & Treatment',
    description: 'Understand the importance of quality seeds, certified varieties, and pre-sowing seed treatment.',
  },
  {
    id: 'crop-3',
    category: 'Crop Basics',
    icon: <Calendar className="w-6 h-6 text-blue-600" />,
    title: 'Crop Calendar & Timing',
    description: 'Follow optimal sowing and harvesting times to ensure better yields and avoid pest pressures.',
  },

  // Soil & Fertilizers
  {
    id: 'soil-1',
    category: 'Soil & Fertilizers',
    icon: <Layers className="w-6 h-6 text-amber-700" />,
    title: 'Understanding Soil Types',
    description: 'Learn about different soil types (clay, loam, sandy) and their characteristics.',
  },
  {
    id: 'soil-2',
    category: 'Soil & Fertilizers',
    icon: <TestTube className="w-6 h-6 text-purple-600" />,
    title: 'Soil Testing & Health',
    description: 'Regular soil testing helps determine nutrient levels, pH, and organic matter content.',
  },
  {
    id: 'soil-3',
    category: 'Soil & Fertilizers',
    icon: <Pill className="w-6 h-6 text-red-500" />,
    title: 'Fertilizer Management',
    description: 'Apply the right fertilizers at the right time. Understand NPK ratios and organic options.',
  },

  // Government Schemes
  {
    id: 'scheme-1',
    category: 'Government Schemes',
    icon: <Landmark className="w-6 h-6 text-neutral-700" />,
    title: 'PM-KISAN Scheme',
    description: 'Details on Pradhan Mantri Kisan Samman Nidhi providing income support to farmers.',
  },
  {
    id: 'scheme-2',
    category: 'Government Schemes',
    icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
    title: 'Crop Insurance (PMFBY)',
    description: 'Protect against crop losses due to natural calamities, pests, and diseases.',
  },
  {
    id: 'scheme-3',
    category: 'Government Schemes',
    icon: <Banknote className="w-6 h-6 text-green-700" />,
    title: 'Agricultural Credit & Loans',
    description: 'Information about Kisan Credit Card (KCC) and agricultural loans.',
  },

  // Safety & Best Practices
  {
    id: 'safety-1',
    category: 'Safety & Best Practices',
    icon: <ShieldAlert className="w-6 h-6 text-orange-600" />,
    title: 'Pesticide Safety',
    description: 'Proper handling, application, and storage of pesticides using protective equipment.',
  },
  {
    id: 'safety-2',
    category: 'Safety & Best Practices',
    icon: <Recycle className="w-6 h-6 text-green-500" />,
    title: 'Sustainable Farming',
    description: 'Adopt crop rotation, integrated pest management, and water conservation techniques.',
  },
  {
    id: 'safety-3',
    category: 'Safety & Best Practices',
    icon: <Globe className="w-6 h-6 text-blue-400" />,
    title: 'Climate-Smart Agriculture',
    description: 'Adapt to changing climate patterns with resilient farming techniques.',
  },
];

const groupedResources = resources.reduce((acc, resource) => {
  if (!acc[resource.category]) {
    acc[resource.category] = [];
  }
  acc[resource.category].push(resource);
  return acc;
}, {} as Record<string, Resource[]>);

export default function ResourcesPage() {
  return (
    <div className="bg-neutral-50 min-h-screen pt-24 pb-16">
      <Container>
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-6 tracking-tight">
            Knowledge <span className="text-primary-600">Hub</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Essential guides, best practices, and government schemes to help you farm better.
          </p>

          {/* Search Bar Placeholder */}
          <div className="max-w-xl mx-auto mt-8 relative">
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-neutral-200 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            <span className="absolute left-4 top-3.5 text-neutral-400">
              <Search className="w-5 h-5" />
            </span>
          </div>
        </div>

        {/* Resources by Category */}
        <div className="space-y-20">
          {Object.entries(groupedResources).map(([category, categoryResources]) => (
            <section key={category} className="animate-slide-up">
              <div className="flex items-center mb-8">
                <h2 className="text-2xl font-bold text-neutral-900 mr-4">
                  {category}
                </h2>
                <div className="h-px bg-neutral-200 flex-grow"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryResources.map((resource) => (
                  <Card key={resource.id} hover variant="default" className="border-t-4 border-t-primary-500 h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                          {resource.icon}
                        </div>
                      </div>
                      <CardTitle className="mt-4 text-lg">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neutral-600 text-sm leading-relaxed">
                        {resource.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 relative rounded-3xl overflow-hidden bg-primary-900 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-700 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-600 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative z-10 px-8 py-16 text-center">
            <h3 className="text-3xl font-bold mb-4">Can't find what you need?</h3>
            <p className="text-primary-100 max-w-2xl mx-auto mb-8 text-lg">
              Our AI Assistant is trained on millions of data points to answer specific agricultural queries.
            </p>
            <a href="/assistant">
              <Button size="lg" className="bg-white text-primary-900 hover:bg-neutral-100 font-semibold shadow-lg">
                Ask AI Assistant Now
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
