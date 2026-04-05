import React from 'react';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 placeholder-opacity-100">
      {/* Navigation */}
      <header className="bg-teal-50 shadow-sm border-b border-teal-100">
        <nav className="flex justify-between items-center py-5 px-8 max-w-7xl mx-auto">
          <div className="text-2xl font-bold text-teal-800 flex items-center gap-3">
            <img src="/favicon.ico" alt="TLC Logo" className="w-8 h-8 object-contain" />
            TLC Platform
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-teal-800 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-teal-800 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-teal-800 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-teal-800 transition-colors">About</a>
            <a href="#contact" className="hover:text-teal-800 transition-colors">Contact</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Streamline Teaching Loads. Ensure Compliance. Empower Institutions.
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
            Automate faculty workload management, enforce institutional policies, and gain real-time insights with the TLC Platform.
          </p>
          <div className="space-y-6">
            <button className="bg-teal-700 text-white px-8 py-4 rounded-md font-semibold hover:bg-teal-800 transition">
              Request a Demo
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Trusted by academic institutions nationwide
            </div>
          </div>
        </div>
        <div className="bg-gray-100 rounded-3xl aspect-[4/3] flex items-center justify-center border border-gray-200 shadow-lg overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-tr from-teal-100 to-gray-50 opacity-50"></div>
           <span className="text-gray-400 font-medium z-10">[ Platform Dashboard Preview Image ]</span>
        </div>
      </section>

      {/* What is TLC Platform Section */}
      <section className="bg-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">What is the TLC Platform?</h2>
            <p className="text-gray-600 leading-relaxed">
              The Teaching Load Compliance Platform is a comprehensive solution designed to modernize academic workload management. Our system helps institutions enforce policies, automate complex calculations, and maintain compliance across all departments.
            </p>
            <ul className="space-y-4 mt-6">
              <li className="flex items-center gap-3 text-gray-700 font-medium"><CheckIcon /> Multi-tenant academic system</li>
              <li className="flex items-center gap-3 text-gray-700 font-medium"><CheckIcon /> Policy-driven workload computation</li>
              <li className="flex items-center gap-3 text-gray-700 font-medium"><CheckIcon /> Automated compliance validation</li>
            </ul>
          </div>
          <div className="bg-gray-200 rounded-2xl aspect-video shadow-md flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300"></div>
             <span className="text-gray-500 font-medium z-10">[ Platform Screenshot ]</span>
          </div>
        </div>
      </section>

      {/* Powerful Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Modern Institutions</h2>
            <p className="text-gray-600">Everything you need to manage teaching loads, enforce policies, and maintain compliance</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Teaching Load Automation', desc: 'Automatically calculate faculty teaching loads based on institutional policies and course assignments.' },
              { title: 'Policy Enforcement Engine', desc: 'Define and enforce complex institutional policies with our flexible rule-based system.' },
              { title: 'Multi-Tenant Architecture', desc: 'Secure, scalable platform supporting multiple institutions with complete data isolation.' },
              { title: 'Role-Based Access Control', desc: 'Granular permissions ensure users only access information relevant to their role.' },
              { title: 'Approval Workflow System', desc: 'Streamlined approval processes for course assignments and load adjustments.' },
              { title: 'Real-Time Compliance Monitoring', desc: 'Track compliance status in real-time with alerts for policy violations and exceptions.' }
            ].map((feat, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-lg flex items-center justify-center mb-6">
                  {/* Generic icon placeholder */}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600">Get started with TLC Platform in four simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center relative">
            {/* Extremely simple horizontal line linking steps */}
            <div className="hidden md:block absolute top-[40px] left-1/4 right-1/4 h-[2px] bg-teal-100 -z-10"></div>
            {[
              { step: '01', title: 'Set up your institution', desc: 'Configure your institution\'s basic information, departments, and organizational structure.' },
              { step: '02', title: 'Define policies and roles', desc: 'Create custom policies for teaching loads and define user roles with appropriate permissions.' },
              { step: '03', title: 'Assign teaching loads', desc: 'Assign courses to faculty members and let the system automatically calculate their teaching loads.' },
              { step: '04', title: 'Monitor compliance and approvals', desc: 'Track compliance in real-time, manage approval workflows, and generate comprehensive reports.' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="text-5xl font-black text-teal-100 mb-2">{item.step}</div>
                <div className="w-16 h-16 bg-teal-700 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-teal-700/30">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Every Stakeholder */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for Every Stakeholder</h2>
            <p className="text-gray-600">TLC Platform serves the unique needs of administrators, departments, and faculty</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'For Administrators',
                desc: 'Streamline workload management across departments, automate institutional policies, and gain comprehensive oversight with powerful reporting tools.',
                points: ['Centralized workload management', 'Policy compliance tracking', 'Comprehensive analytics and reporting', 'Automated approval workflows']
              },
              {
                title: 'For Departments',
                desc: 'Manage faculty assignments efficiently, balance teaching loads, and ensure fair distribution of courses across your department.',
                points: ['Department-level oversight', 'Fair load distribution', 'Course assignment optimization', 'Real-time compliance alerts']
              },
              {
                title: 'For Faculty',
                desc: 'View your teaching assignments, track your workload progress, and submit requests through a simple, intuitive interface.',
                points: ['Clear workload visibility', 'Easy request submission', 'Teaching history tracking', 'Mobile-friendly access']
              }
            ].map((role, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                 <div className="w-12 h-12 bg-teal-700 rounded-full text-white flex items-center justify-center mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                 </div>
                 <h3 className="text-xl font-bold mb-4">{role.title}</h3>
                 <p className="text-gray-500 text-sm mb-8 min-h-[80px]">{role.desc}</p>
                 <ul className="space-y-3">
                   {role.points.map((p, j) => (
                     <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                       <CheckIcon />
                       {p}
                     </li>
                   ))}
                 </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600">Choose the plan that best fits your institution's needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            {/* Basic */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-2">Basic</h3>
               <div className="text-3xl font-bold mb-4">Contact Us</div>
               <p className="text-sm text-gray-500 mb-8">Perfect for small institutions getting started</p>
               <ul className="space-y-4 mb-8">
                 {['Up to 100 faculty members', 'Core teaching load features', 'Basic policy enforcement', 'Email support', 'Monthly reports'].map((p, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm text-gray-600"><CheckIcon /> {p}</li>
                 ))}
               </ul>
               <button className="w-full py-3 bg-teal-700 text-white rounded-md font-semibold hover:bg-teal-800 transition">Get Started</button>
            </div>
            {/* Professional */}
            <div className="bg-teal-700 text-white rounded-2xl p-10 transform md:-translate-y-4 shadow-2xl">
               <h3 className="text-lg font-bold text-teal-100 mb-2">Professional</h3>
               <div className="text-3xl font-bold mb-4">Contact Us</div>
               <p className="text-sm text-teal-100 mb-8">Ideal for growing institutions</p>
               <ul className="space-y-4 mb-8">
                 {['Up to 500 faculty members', 'Full feature access', 'Advanced workflow automation', 'Custom policy rules', 'Priority support', 'Real-time analytics', 'API access'].map((p, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm text-white">
                      <svg className="w-5 h-5 text-teal-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      {p}
                   </li>
                 ))}
               </ul>
               <button className="w-full py-3 bg-white text-teal-800 rounded-md font-bold hover:bg-gray-100 transition">Get Started</button>
            </div>
            {/* Enterprise */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-2">Enterprise</h3>
               <div className="text-3xl font-bold mb-4">Custom</div>
               <p className="text-sm text-gray-500 mb-8">For large institutions and multi-campus systems</p>
               <ul className="space-y-4 mb-8">
                 {['Unlimited faculty members', 'Multi-campus support', 'Custom policy engine', 'Dedicated support team', 'Advanced security features', 'Custom integrations', 'Training & onboarding', 'SLA guarantee'].map((p, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm text-gray-600"><CheckIcon /> {p}</li>
                 ))}
               </ul>
               <button className="w-full py-3 bg-teal-700 text-white rounded-md font-semibold hover:bg-teal-800 transition">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="bg-orange-50 py-24">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">About Us</h2>
            <p className="text-gray-700 leading-relaxed font-medium">
              Our Mission: <span className="font-normal text-gray-600">To modernize academic workload management through automation and policy-driven systems.</span>
            </p>
            <p className="text-gray-600 leading-relaxed">
              The TLC Platform was born from years of experience working with academic institutions struggling with manual workload tracking, inconsistent policy enforcement, and limited visibility into faculty assignments.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We believe that education administrators deserve modern tools that match the complexity of their work. Our platform combines advanced technology with deep understanding of academic operations to deliver a solution that truly works.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, we're proud to serve institutions across the country, helping them streamline operations, ensure compliance, and focus on what matters most: delivering quality education.
            </p>
          </div>
          <div className="bg-gray-200 rounded-3xl aspect-[4/3] shadow-md flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-300"></div>
             <span className="text-gray-500 font-medium z-10">[ Meeting/Office Photo Placeholder ]</span>
          </div>
        </div>
      </section>

      {/* Get in Touch */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-gray-600">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-16">
            {/* Form */}
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" placeholder="John Doe" className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" placeholder="john@university.edu" className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                <input type="text" placeholder="University Name" className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea rows={4} placeholder="Tell us about your needs..." className="w-full px-4 py-3 rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button type="button" className="w-full py-3 bg-teal-700 text-white rounded-md font-semibold hover:bg-teal-800 transition">Send Message</button>
                <button type="button" className="w-full py-3 bg-teal-500 text-white rounded-md font-semibold hover:bg-teal-600 transition">Request Demo</button>
              </div>
            </form>
            {/* Info */}
            <div className="space-y-10">
              <h3 className="text-xl font-bold">Contact Information</h3>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Email</h4>
                    <a href="mailto:support@tlcplatform.edu" className="block text-sm text-gray-600 hover:text-teal-700">support@tlcplatform.edu</a>
                    <a href="mailto:sales@tlcplatform.edu" className="block text-sm text-gray-600 hover:text-teal-700">sales@tlcplatform.edu</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Phone</h4>
                    <p className="text-sm text-gray-600 mb-1">09123456789</p>
                    <p className="text-sm text-gray-500">Mon-Fri, 9am-5pm</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Office</h4>
                    <p className="text-sm text-gray-600">The TLC North</p>
                    <p className="text-sm text-gray-600">Lahug, Cebu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-teal-700 text-white py-20 text-center px-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Institution?</h2>
        <p className="text-teal-100 mb-8">Join the growing number of institutions streamlining their teaching load management with TLC Platform.</p>
        <button className="bg-white text-teal-800 px-8 py-4 rounded-md font-bold hover:bg-gray-100 transition">
          Request Demo
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12 border-b border-gray-800 pb-12">
          <div className="space-y-4">
            <div className="text-2xl font-bold text-white flex items-center gap-3">
              <img src="/favicon.ico" alt="TLC Logo" className="w-8 h-8 object-contain" />
              TLC
            </div>
            <p className="text-sm leading-relaxed">
              Modernizing academic workload management through automation and policy-driven systems.
            </p>
            <div className="flex gap-4 pt-2">
              {/* Fake social icon paths */}
              {['M8 22V10h-3v12h3zm-1.5-13.3c.9 0 1.5-.6 1.5-1.4S7.4 6 6.5 6 5 6.6 5 7.4s.6 1.3 1.5 1.3zM20 22h-3v-6c0-1.4-.4-2.4-1.8-2.4-1 0-1.5.7-1.8 1.3 0 .2-.1.5-.1.7v6.4h-3s.1-10.8 0-12h3v1.7c.4-.6 1.1-1.5 2.7-1.5 2 0 3.5 1.3 3.5 4.1V22z', 'M24 4.5c-.9.4-1.8.6-2.8.7 1-.6 1.8-1.6 2.2-2.7-1 .6-2 1-3.1 1.2-1-.1-1.9-.6-2.6-1.2C16.3 1.2 14.8.8 13.5 1.5c-1.3.7-2.1 2-2.1 3.5 0 .3 0 .7.1 1-3.6-.2-6.8-1.9-8.9-4.5-.4.6-.5 1.3-.5 2 0 1.5.8 2.8 2 3.6-.8 0-1.6-.2-2.2-.6v.1c0 2.3 1.6 4.3 3.9 4.8-.4.1-.8.2-1.3.2-.3 0-.6 0-.9-.1.6 1.9 2.4 3.3 4.5 3.3-1.6 1.3-3.7 2-5.9 2-.3 0-.7 0-1-.1 2.2 1.4 4.7 2.2 7.4 2.2 8.8 0 13.6-7.3 13.6-13.6v-.6c.9-.7 1.7-1.5 2.4-2.4z'].map((d, i) => (
                <div key={i} className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d={d}/></svg>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition">Features</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm">
          © 2026 TLC Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
