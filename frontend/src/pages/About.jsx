import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Users, Zap, Heart, Globe, GraduationCap, Code, Database, Palette, Brain, Server, Smartphone } from 'lucide-react';
import './About.css';

function AnimatedStat({ end, suffix = '', label }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let start = 0;
    const duration = 1800;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = end / steps;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              start = end;
              clearInterval(timer);
            }
            el.textContent = Math.floor(start) + suffix;
          }, stepTime);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, suffix]);

  return (
    <div className="stat-item">
      <span className="stat-number" ref={ref}>0{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();

  const team = [
    {
      name: 'Andrés Villarroel',
      role: 'Full-Stack Developer',
      initials: 'AV',
      desc: 'Arquitecto del backend y sistema de autenticación. Apasionado por las APIs RESTful y la seguridad de datos.'
    },
    {
      name: 'Camila Mendoza',
      role: 'Frontend & UX Designer',
      initials: 'CM',
      desc: 'Diseñadora de la interfaz y experiencia de usuario. Especialista en diseño responsivo y micro-animaciones.'
    },
    {
      name: 'Diego Torrez',
      role: 'AI & Data Engineer',
      initials: 'DT',
      desc: 'Desarrollador del motor de búsqueda inteligente con IA. Investigador en procesamiento de lenguaje natural.'
    }
  ];

  const values = [
    {
      icon: <Heart size={22} />,
      title: 'Comercio Local',
      desc: 'Impulsamos a los emprendedores sucrenses dándoles visibilidad digital para llegar a más clientes.'
    },
    {
      icon: <Brain size={22} />,
      title: 'Inteligencia Artificial',
      desc: 'Búsqueda semántica que entiende lenguaje natural: "busco algo barato para correr en color rojo".'
    },
    {
      icon: <ShieldCheck size={22} />,
      title: 'Confianza y Seguridad',
      desc: 'Cada tienda pasa por un proceso de verificación antes de ser visible en la plataforma.'
    },
    {
      icon: <Zap size={22} />,
      title: 'Rendimiento',
      desc: 'Arquitectura optimizada con FastAPI y React para tiempos de respuesta menores a 200ms.'
    },
    {
      icon: <Users size={22} />,
      title: 'Inclusión Digital',
      desc: 'Democratizamos el acceso al comercio electrónico para pequeños y medianos negocios de Sucre.'
    },
    {
      icon: <Globe size={22} />,
      title: 'Impacto Social',
      desc: 'Proyecto académico con visión real: fortalecer la economía local mediante tecnología moderna.'
    }
  ];

  const techStack = [
    { icon: '⚛️', name: 'React' },
    { icon: '⚡', name: 'Vite' },
    { icon: '🐍', name: 'FastAPI' },
    { icon: '🗄️', name: 'SQLAlchemy' },
    { icon: '🤖', name: 'Gemini AI' },
    { icon: '🔐', name: 'JWT Auth' }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-hero-badge">Proyecto Universitario 2026</div>
          <h1>Conectamos <span>Sucre</span> con el futuro digital.</h1>
          <p className="about-hero-desc">
            SucreShop es una plataforma de comercio electrónico local potenciada por inteligencia artificial, 
            diseñada para dar visibilidad a los emprendedores de la ciudad blanca de Bolivia.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats">
        <AnimatedStat end={8} suffix="+" label="Tiendas Registradas" />
        <AnimatedStat end={18} suffix="+" label="Productos Listados" />
        <AnimatedStat end={6} label="Categorías" />
        <AnimatedStat end={3} label="Integrantes" />
      </section>

      {/* Story */}
      <section className="about-story">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-image">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
                alt="Equipo trabajando en SucreShop"
              />
            </div>
            <div className="about-story-text">
              <h2>De una idea universitaria a una solución real.</h2>
              <p>
                SucreShop nació como proyecto final de la carrera de Ciencias de la Computación 
                en la Universidad San Francisco Xavier de Chuquisaca (USFX). La premisa era simple pero 
                ambiciosa: ¿qué pasaría si los comercios locales de Sucre tuvieran su propio marketplace 
                inteligente?
              </p>
              <p>
                Combinando un backend robusto en Python con una interfaz moderna en React y un motor 
                de búsqueda potenciado por IA, construimos una plataforma donde los emprendedores sucrenses 
                pueden mostrar sus productos y los compradores pueden encontrar exactamente lo que necesitan 
                usando lenguaje natural.
              </p>
              <div className="story-highlight">
                <div className="story-highlight-icon">
                  <Sparkles size={20} />
                </div>
                <div className="story-highlight-text">
                  <h4>Búsqueda con IA Integrada</h4>
                  <p>
                    Nuestro motor entiende consultas como "laptop gamer barata con 16GB de RAM" 
                    y filtra automáticamente por categoría, precio, marca y especificaciones técnicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-values">
        <div className="container">
          <div className="about-section-header">
            <h2>Nuestros Pilares</h2>
            <p>Los principios que guían cada línea de código que escribimos.</p>
          </div>
          <div className="values-grid">
            {values.map((v, i) => (
              <div className="value-card" key={i}>
                <div className="value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="about-team">
        <div className="container">
          <div className="about-section-header">
            <h2>El Equipo</h2>
            <p>Tres estudiantes, una misión: digitalizar el comercio sucrense.</p>
          </div>
          <div className="team-grid">
            {team.map((member, i) => (
              <div className="team-card" key={i}>
                <div className="team-avatar">{member.initials}</div>
                <h3>{member.name}</h3>
                <div className="team-role">{member.role}</div>
                <p className="team-desc">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-tech">
        <div className="container">
          <div className="about-section-header">
            <h2>Stack Tecnológico</h2>
            <p>Herramientas modernas para un resultado profesional.</p>
          </div>
          <div className="tech-grid">
            {techStack.map((tech, i) => (
              <div className="tech-item" key={i}>
                <div className="tech-item-icon">{tech.icon}</div>
                <span>{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* University Footer */}
      <section className="about-university">
        <div className="container">
          <div className="university-badge">
            <div className="university-badge-icon">
              <GraduationCap size={24} />
            </div>
            <div className="university-badge-text">
              <h4>Universidad San Francisco Xavier de Chuquisaca</h4>
              <p>Carrera de Ciencias de la Computación — Gestión 2026</p>
            </div>
          </div>
          <p className="university-caption">
            Proyecto académico desarrollado como trabajo final de semestre. 
            SucreShop es una demostración funcional de tecnologías web modernas aplicadas al comercio electrónico local.
          </p>
        </div>
      </section>
    </div>
  );
}
