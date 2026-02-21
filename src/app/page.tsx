"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: "📋", title: "Inscription Numérique",    desc: "Formulaire complet avec photo, état civil, diplômes et statut. Zéro papier." },
  { icon: "🔢", title: "Matricule Automatique",    desc: "Attribution séquentielle INSFS-XXXX. Unicité garantie." },
  { icon: "🔍", title: "Recherche Instantanée",    desc: "Retrouvez tout étudiant en moins de 2 secondes par nom ou matricule." },
  { icon: "💰", title: "Suivi Financier",          desc: "Multi-tranches, espèces, virement, mobile money — suivi du recouvrement." },
  { icon: "📄", title: "Documents Officiels",      desc: "Certificats et fiches avec en-tête ministériel et QR code d'authenticité." },
  { icon: "📊", title: "Pilotage Décisionnel",     desc: "Tableau de bord : effectifs, répartition par école, taux de recouvrement." },
];

const KPIS = [
  { value: "4", label: "Établissements", color: "#14623A" },
  { value: "3", label: "Rôles utilisateurs", color: "#D4710A" },
  { value: "PDF", label: "Documents générés", color: "#2B6CB0" },
  { value: "QR", label: "Code d'authenticité", color: "#B7791F" },
];

const SCHOOLS = [
  { code: "EES",  name: "École des Éducateurs Spécialisés",          bg: "#D4710A" },
  { code: "EEP",  name: "École des Éducateurs de la Petite Enfance", bg: "#14623A" },
  { code: "EAS",  name: "École des Assistants Sociaux",              bg: "#2B6CB0" },
  { code: "CPPE", name: "Centre de Perfectionnement CPPE-Pilote",    bg: "#B7791F" },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const navScrolled = scrollY > 60;

  return (
    <div
      ref={containerRef}
      style={{ height: "100vh", overflowY: "auto", fontFamily: "'Source Sans 3', sans-serif", color: "#1C2A3A" }}
    >
      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px",
        background: navScrolled ? "rgba(253,251,248,.96)" : "transparent",
        backdropFilter: navScrolled ? "blur(16px)" : "none",
        borderBottom: navScrolled ? "1px solid #E2DCD4" : "none",
        transition: "all .5s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: "1px solid #E2DCD4", flexShrink: 0 }}>
            <Image src="/insfs-logo.jpg" alt="INSFS" fill className="object-cover" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Merriweather', serif" }}>INSFS</div>
            <div style={{ fontSize: 9, color: "#8899AA", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Formation Sociale</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 13, fontWeight: 600 }}>
          <a href="#about" style={{ color: "#4A5568", textDecoration: "none" }}>À propos</a>
          <a href="#features" style={{ color: "#4A5568", textDecoration: "none" }}>Fonctionnalités</a>
          <a href="#schools" style={{ color: "#4A5568", textDecoration: "none" }}>Écoles</a>
          <Link href="/login" style={{
            background: "linear-gradient(135deg,#D4710A,#E8912A)", color: "#fff",
            border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 4px 16px #D4710A40",
          }}>
            Connexion →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", minHeight: "100vh", display: "flex", alignItems: "center",
        overflow: "hidden",
        background: "linear-gradient(165deg,#FDFBF8 0%,#FFF8EF 40%,#F0F9F4 100%)",
      }}>
        {/* Cercles décoratifs */}
        <div style={{ position: "absolute", top: -150, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,#FFECD2 0%,transparent 70%)", opacity: .6 }} />
        <div style={{ position: "absolute", bottom: -100, left: -50, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,#D1FAE5 0%,transparent 70%)", opacity: .5 }} />

        {/* Image 1 */}
        <div style={{
          position: "absolute", top: "8%", right: "4%", width: 370, height: 410,
          borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,.1)",
          transform: `rotate(2deg) translateY(${-scrollY * .1}px)`,
          opacity: visible ? 1 : 0, transition: "opacity 1s ease .3s",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=800&q=80" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(20,98,58,.25) 0%,transparent 50%)" }} />
        </div>

        {/* Image 2 */}
        <div style={{
          position: "absolute", top: "55%", right: "1%", width: 190, height: 190,
          borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.1)",
          transform: `rotate(-3deg) translateY(${-scrollY * .07}px)`,
          opacity: visible ? 1 : 0, transition: "opacity 1s ease .6s", border: "3px solid #fff",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        </div>

        {/* Contenu principal */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 560, padding: "0 40px", marginTop: 20 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#14623A10", borderRadius: 6, padding: "5px 14px", marginBottom: 24,
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all .8s ease .1s",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14623A" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#14623A", letterSpacing: 1.5, textTransform: "uppercase" }}>
              République de Côte d&apos;Ivoire
            </span>
          </div>

          <h1 style={{
            fontSize: 50, fontWeight: 400, lineHeight: 1.1, margin: 0,
            fontFamily: "'Merriweather', serif", letterSpacing: -.5,
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all .8s ease .2s",
          }}>
            Institut National<br />
            <span style={{ color: "#D4710A", fontWeight: 700 }}>Supérieur</span> de<br />
            Formation <span style={{ color: "#14623A", fontWeight: 700 }}>Sociale</span>
          </h1>

          <p style={{
            fontSize: 16, color: "#4A5568", maxWidth: 430, margin: "20px 0 0", lineHeight: 1.8,
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all .8s ease .4s",
          }}>
            Plateforme de gestion numérique des inscriptions, du suivi académique et de la production documentaire officielle.
          </p>

          <div style={{
            marginTop: 32, display: "flex", gap: 12,
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all .8s ease .5s",
          }}>
            <Link href="/login" style={{
              background: "linear-gradient(135deg,#D4710A,#E8912A)", color: "#fff",
              border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700,
              textDecoration: "none", boxShadow: "0 6px 28px #D4710A45",
            }}>
              Accéder à la plateforme
            </Link>
            <a href="#features" style={{
              background: "#fff", color: "#1C2A3A", border: "1.5px solid #E2DCD4",
              padding: "14px 24px", borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none",
            }}>
              En savoir plus
            </a>
          </div>
        </div>
      </section>

      {/* ── À propos ── */}
      <section id="about" style={{ padding: "80px 40px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#D4710A", marginBottom: 12 }}>À propos</div>
            <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Merriweather', serif", margin: "0 0 16px", lineHeight: 1.3 }}>
              L&apos;excellence dans la formation des travailleurs sociaux
            </h2>
            <p style={{ fontSize: 15, color: "#4A5568", lineHeight: 1.8, margin: 0 }}>
              L&apos;INSFS forme depuis des décennies les éducateurs spécialisés, assistants sociaux et éducateurs préscolaires de Côte d&apos;Ivoire. Cette plateforme numérique modernise la gestion administrative pour un service plus rapide, fiable et transparent.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {KPIS.map((k) => (
              <div key={k.label} style={{ background: "#F8F6F2", borderRadius: 12, padding: "24px 20px", textAlign: "center", border: "1px solid #F2EFEA" }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: k.color, fontFamily: "'Merriweather', serif", lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 12, color: "#8899AA", marginTop: 8, fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="features" style={{ padding: "80px 40px", background: "#F8F6F2" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#14623A", marginBottom: 10 }}>Fonctionnalités</div>
            <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Merriweather', serif", margin: 0 }}>
              Une solution <span style={{ color: "#D4710A" }}>complète</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={{
                  background: "#fff", borderRadius: 14, padding: "28px 22px",
                  border: "1px solid #E2DCD4", transition: "all .3s cubic-bezier(.4,0,.2,1)",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,.06)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#D4710A";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = "";
                  (e.currentTarget as HTMLElement).style.borderColor = "#E2DCD4";
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10, marginBottom: 14,
                  background: i % 2 === 0 ? "#FFF8EF" : "#F0F9F4",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", fontFamily: "'Merriweather', serif" }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: "#4A5568", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Établissements ── */}
      <section id="schools" style={{
        padding: "80px 40px",
        background: "linear-gradient(170deg,#F0F9F4 0%,#FFF8EF 100%)",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#14623A", marginBottom: 10 }}>Établissements</div>
            <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Merriweather', serif", margin: 0 }}>
              4 écoles, <span style={{ color: "#D4710A" }}>une mission</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {SCHOOLS.map((s) => (
              <div key={s.code} style={{
                background: "rgba(255,255,255,.9)", backdropFilter: "blur(12px)",
                borderRadius: 14, padding: "28px 20px", textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,.04)",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, background: s.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px", fontSize: 13, fontWeight: 800, color: "#fff",
                  fontFamily: "'Merriweather', serif",
                }}>
                  {s.code}
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px", fontFamily: "'Merriweather', serif", lineHeight: 1.4 }}>{s.name}</h4>
                <div style={{ width: 30, height: 2, background: s.bg, margin: "0 auto", borderRadius: 1 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: "80px 40px", textAlign: "center",
        background: "linear-gradient(135deg,#14623A,#D4710A)",
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 12px", color: "#fff", fontFamily: "'Merriweather', serif" }}>
          Modernisez la gestion de vos inscriptions
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", marginBottom: 32 }}>
          Accédez à la plateforme sécurisée de l&apos;INSFS.
        </p>
        <Link href="/login" style={{
          background: "#fff", color: "#14623A", border: "none",
          padding: "16px 40px", borderRadius: 10, fontSize: 15, fontWeight: 800,
          textDecoration: "none", boxShadow: "0 8px 32px rgba(0,0,0,.15)",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          Accéder à la plateforme <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "24px 40px", background: "#1C2A3A",
        textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.4)",
      }}>
        INSFS · Cocody, Abidjan · Tél : 07 47 14 38 34 · infsofficiel@gmail.com · 01 BP 2625
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap');
      `}</style>
    </div>
  );
}
