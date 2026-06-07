import React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useLang } from "../context/language";
import { Briefcase, Rocket, Globe, Clock, ChevronRight } from "lucide-react";

export function Careers() {
  const { t } = useLang();

  const benefits = [
    {
      icon: <Rocket className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      title: t('careers_benefit_environment'),
      desc: t('careers_benefit_environment_desc'),
      bg: "bg-purple-50 dark:bg-purple-900/30"
    },
    {
      icon: <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      title: t('careers_benefit_impact'),
      desc: t('careers_benefit_impact_desc'),
      bg: "bg-blue-50 dark:bg-blue-900/30"
    },
    {
      icon: <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />,
      title: t('careers_benefit_flexible'),
      desc: t('careers_benefit_flexible_desc'),
      bg: "bg-green-50 dark:bg-green-900/30"
    }
  ];

  const positions = [
    { title: t('careers_pos_frontend'), type: "Full-time", location: "Remote" },
    { title: t('careers_pos_backend'), type: "Full-time", location: "Hybrid" },
    { title: t('careers_pos_ops'), type: "Full-time", location: "On-site" },
    { title: t('careers_pos_marketing'), type: "Contract", location: "Remote" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-green-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1600&auto=format&fit=crop" 
            alt="Team working" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t('careers_hero_title')}
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-10">
            {t('careers_hero_sub')}
          </p>
          <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8">
            View Openings
          </Button>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">{t('careers_why_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-8 border-none shadow-lg hover:shadow-xl transition-shadow text-center">
                <div className={`h-16 w-16 ${benefit.bg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {benefit.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Positions Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">{t('careers_positions_title')}</h2>
          <div className="space-y-4">
            {positions.map((pos, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between hover:border-green-300 dark:hover:border-green-600 transition-colors group cursor-pointer"
              >
                <div className="mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{pos.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" /> {pos.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" /> {pos.location}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 font-semibold flex items-center gap-2">
                  {t('careers_apply_now')} <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery / Culture */}
      <section className="py-20 bg-white dark:bg-gray-900 overflow-hidden transition-colors">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop" alt="Culture 1" className="rounded-2xl h-64 w-full object-cover shadow-md" />
            <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400&auto=format&fit=crop" alt="Culture 2" className="rounded-2xl h-64 w-full object-cover shadow-md translate-y-8" />
            <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=400&auto=format&fit=crop" alt="Culture 3" className="rounded-2xl h-64 w-full object-cover shadow-md" />
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop" alt="Culture 4" className="rounded-2xl h-64 w-full object-cover shadow-md translate-y-8" />
          </div>
        </div>
      </section>
    </div>
  );
}
