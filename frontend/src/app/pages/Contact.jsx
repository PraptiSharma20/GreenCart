import React, { useState, useEffect, useContext } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useLang } from "../context/language";
import { AuthContext } from "../context/auth";
import { ThemeContext } from "../context/ThemeContext";
import { Phone, Mail, MessageSquare, Send, CheckCircle2, Loader2, User, ShoppingBag } from "lucide-react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const CONTACT_IMAGES = {
  hero:
    "https://www.shutterstock.com/image-photo/website-internet-contact-us-page-600nw-207873067.jpg",
  sidebar:
    "https://img.magnific.com/free-photo/hot-line-contact-us-call-center-search-interface_53876-124009.jpg?semt=ais_hybrid&w=740&q=80",
};

export function Contact() {
  const { t } = useLang();
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    contactType: "Client"
  });

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        contactType: user.role === "vendor" ? "Vendor" : "Client"
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.queries.create(formData);
      setSubmitted(true);
      setFormData({ 
        name: user?.name || "", 
        email: user?.email || "", 
        subject: "", 
        message: "",
        contactType: user?.role === "vendor" ? "Vendor" : "Client" 
      });
      setTimeout(() => setSubmitted(false), 5000);
      toast.success("Your message has been sent successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <Phone className="h-6 w-6 text-green-600" />,
      label: t('contact_phone'),
      value: "7018808336",
      href: "tel:7018808336"
    },
    {
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      label: t('contact_email'),
      value: "sharmaprapti2004@gmail.com",
      href: "mailto:sharmaprapti2004@gmail.com"
    },
    {
      icon: <Mail className="h-6 w-6 text-purple-600" />,
      label: t('contact_support_email'),
      value: "manish.singh0617@gmail.com",
      href: "mailto:manish.singh0617@gmail.com"
    },
  ];

  return (
    <div className={`flex flex-col min-h-screen w-full min-w-0 overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 py-14 sm:py-20 md:py-24 text-white">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={CONTACT_IMAGES.hero}
            alt="Fresh produce at a local market"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-full">
              <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 drop-shadow-lg px-2">{t('contact_hero_title')}</h1>
          <p className="text-base sm:text-xl md:text-2xl text-green-100 max-w-3xl mx-auto drop-shadow-md px-2">
            {t('contact_hero_sub')}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 -mt-8 sm:-mt-12 relative z-20 w-full max-w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4 min-w-0">
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('contact_info_title')}
            </h2>
            {contactInfo.map((info, index) => (
              <a 
                key={index} 
                href={info.href}
                className="block group min-w-0"
              >
                <Card className={`p-4 sm:p-6 hover:shadow-lg transition-all border-none overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gray-800 group-hover:bg-gray-700' 
                    : 'bg-white group-hover:bg-green-50'
                }`}>
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className={`h-11 w-11 sm:h-12 sm:w-12 shrink-0 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-white'
                    } rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {info.icon}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{info.label}</p>
                      <p className={`text-sm sm:text-base md:text-lg font-bold leading-snug text-break-safe ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{info.value}</p>
                    </div>
                  </div>
                </Card>
              </a>
            ))}

            {/* Decorative Image Card */}
            <Card className={`p-0 overflow-hidden border-none ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <img 
                src={CONTACT_IMAGES.sidebar}
                alt="Colorful fresh vegetables at a farmers market"
                className="w-full h-48 object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p className="text-sm italic text-break-safe">{t('contact_help_text')}</p>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 min-w-0">
            <Card className={`p-5 sm:p-8 md:p-12 border-none shadow-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } h-full overflow-hidden`}>
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
                  <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-14 w-14 text-green-600" />
                  </div>
                  <h2 className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{t('contact_form_success')}</h2>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    We'll get back to you as soon as possible.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-8 rounded-full px-8 w-full sm:w-auto"
                    onClick={() => setSubmitted(false)}
                  >
                    {t('send_another')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 min-w-0">
                  <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{t('contact_form_title')}</h2>
                  
                  {/* Contact Type Dropdown */}
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{t('contact_type_label')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, contactType: 'Client'})}
                        className={`flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all text-sm sm:text-base ${
                          formData.contactType === 'Client' 
                            ? isDarkMode 
                              ? 'border-purple-500 bg-purple-900/30 text-purple-300' 
                              : 'border-purple-500 bg-purple-50 text-purple-700' 
                            : isDarkMode 
                              ? 'border-gray-700 text-gray-400 hover:border-gray-600' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <ShoppingBag className="h-5 w-5 shrink-0" />
                        {t('contact_client')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, contactType: 'Vendor'})}
                        className={`flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all text-sm sm:text-base ${
                          formData.contactType === 'Vendor' 
                            ? isDarkMode 
                              ? 'border-blue-500 bg-blue-900/30 text-blue-300' 
                              : 'border-blue-500 bg-blue-50 text-blue-700' 
                            : isDarkMode 
                              ? 'border-gray-700 text-gray-400 hover:border-gray-600' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <User className="h-5 w-5 shrink-0" />
                        {t('contact_vendor')}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={`text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{t('contact_form_name')}</label>
                      <Input 
                        placeholder="John Doe" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`rounded-xl h-12 focus:ring-green-500 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-sm font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{t('contact_form_email')}</label>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`rounded-xl h-12 focus:ring-green-500 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'border-gray-200'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{t('contact_form_subject')}</label>
                    <Input 
                      placeholder="How can we help?" 
                      required 
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={`rounded-xl h-12 focus:ring-green-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'border-gray-200'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-semibold ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{t('contact_form_message')}</label>
                    <Textarea 
                      placeholder="Your message here..." 
                      required 
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={`rounded-xl min-h-[150px] focus:ring-green-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'border-gray-200'
                      }`}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-10 py-5 sm:py-6 rounded-xl text-base sm:text-lg font-bold transition-all hover:shadow-xl sm:hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin shrink-0" /> {t('sending')}</> : <>{t('contact_form_submit')} <Send className="h-5 w-5 shrink-0" /></>}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
