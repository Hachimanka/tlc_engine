"use client";

import { useEffect, useState } from "react";

const LOADER_DURATION_MS = 5000;
const ANIMATION_CYCLE_MS = 5200;
const NAVBAR_TRANSITION_MS = 800;

export default function LogoLoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsAnimationReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let isPageLoaded = document.readyState === "complete";
    let minDurationPassed = false;
    let removeTimer: number | undefined;

    document.body.classList.add("tlc-page-loading");

    const setNavbarTarget = () => {
      const targetLogo = document.querySelector<HTMLElement>("[data-tlc-navbar-logo]");
      const loaderLogo = document.querySelector<HTMLElement>(".tlc-loader-stage");

      if (!targetLogo || !loaderLogo) {
        return;
      }

      const targetRect = targetLogo.getBoundingClientRect();
      const loaderRect = loaderLogo.getBoundingClientRect();
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const loaderCenterX = loaderRect.left + loaderRect.width / 2;
      const loaderCenterY = loaderRect.top + loaderRect.height / 2;

      loaderLogo.style.setProperty("--tlc-dock-x", `${targetCenterX - loaderCenterX}px`);
      loaderLogo.style.setProperty("--tlc-dock-y", `${targetCenterY - loaderCenterY}px`);
    };

    const finishLoader = () => {
      if (!isPageLoaded || !minDurationPassed) {
        return;
      }

      setNavbarTarget();
      document.body.classList.add("tlc-page-revealing");
      setIsExiting(true);
      removeTimer = window.setTimeout(() => {
        setIsVisible(false);
        document.body.classList.remove("tlc-page-loading", "tlc-page-revealing");
      }, NAVBAR_TRANSITION_MS);
    };

    const handleLoad = () => {
      isPageLoaded = true;
      finishLoader();
    };

    window.addEventListener("load", handleLoad);

    const fadeTimer = window.setTimeout(() => {
      minDurationPassed = true;
      finishLoader();
    }, LOADER_DURATION_MS);

    return () => {
      window.removeEventListener("load", handleLoad);

      window.clearTimeout(fadeTimer);

      if (removeTimer) {
        window.clearTimeout(removeTimer);
      }

      document.body.classList.remove("tlc-page-loading", "tlc-page-revealing");
    };
  }, []);

  useEffect(() => {
    const cycleTimer = window.setInterval(() => {
      if (!isExiting) {
        setAnimationCycle((cycle) => cycle + 1);
      }
    }, ANIMATION_CYCLE_MS);

    return () => window.clearInterval(cycleTimer);
  }, [isExiting]);

  useEffect(() => {
    if (document.readyState === "complete") {
      return;
    }

    const handleLoad = () => {
      setAnimationCycle((cycle) => cycle + 1);
    };

    window.addEventListener("load", handleLoad, { once: true });

    return () => window.removeEventListener("load", handleLoad);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`tlc-loader${isExiting ? " tlc-loader-exiting" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        zIndex: 9999,
        height: "100vh",
        overflow: "visible",
        pointerEvents: "none",
      }}
      role="status"
      aria-label="Loading TLC landing page"
    >
      <div
        className="tlc-loader-bg"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          height: "100vh",
          background: "var(--color-primary)",
        }}
      />
      {isAnimationReady ? (
        <div className="tlc-loader-stage" aria-hidden="true">
          <div key={animationCycle} className="tlc-final-logo">
          <svg
            className="tlc-line tlc-line-middle"
            width="441"
            height="59"
            viewBox="0 0 441 59"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M-0.000143557 25.4526C-0.000143557 25.4526 58.3587 38.5874 125.713 34.6899C182.033 31.4309 236.676 3.25958 271.081 0.683363C346.631 -4.97383 440.937 26.3657 440.937 26.3657C440.937 26.3657 376.74 17.4434 305.291 22.3673C248.154 26.3048 195.138 52.699 160.726 57.302C83.2813 67.661 -0.000143557 25.4526 -0.000143557 25.4526Z" fill="white" />
          </svg>

          <svg
            className="tlc-line tlc-line-bottom"
            width="351"
            height="56"
            viewBox="0 0 351 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M-0.000164597 35.6323C-0.000164597 35.6323 47.0716 43.0831 100.422 36.531C145.032 31.0524 187.032 5.85317 214.253 2.04098C274.03 -6.33032 350.615 13.7511 350.615 13.7511C350.615 13.7511 299.117 9.94882 242.564 17.5269C197.339 23.5868 156.542 47.2898 129.419 52.7137C68.377 64.9203 -0.000164597 35.6323 -0.000164597 35.6323Z" fill="#6DD3C6" />
          </svg>

          <svg
            className="tlc-piece tlc-piece-t"
            width="190"
            height="147"
            viewBox="0 0 190 147"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M147 43C147 50.732 153.268 57 161 57C162.378 57 163.707 56.7969 164.965 56.4258C167.126 55.5073 169.504 55 172 55C181.941 55 190 63.0589 190 73C190 82.9411 181.941 91 172 91C169.504 91 167.126 90.4918 164.965 89.5732C163.708 89.2021 162.378 89 161 89C153.268 89 147 95.268 147 103V147H104V129C104 112.431 90.5685 99 74 99C57.4315 99 44 112.431 44 129V147H0V16C2.19048e-06 7.16345 7.16345 0 16 0H147V43ZM45.4004 16.2002V28.5H65.5V86H80.5V28.5H100.6V16.2002H45.4004Z" fill="#6DD3C6" />
          </svg>

          <svg
            className="tlc-piece tlc-piece-l"
            width="147"
            height="189"
            viewBox="0 0 147 189"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M73 0C82.9411 0 91 8.05887 91 18C91 20.4963 90.4918 22.874 89.5732 25.0352C89.2021 26.2924 89 27.6225 89 29C89 34.8925 92.6405 39.9343 97.7949 42H147V85H129C112.431 85 99 98.4315 99 115C99 131.569 112.431 145 129 145H147V189H16C7.16345 189 0 181.837 0 173V42H48.2051C53.3595 39.9343 57 34.8925 57 29C57 27.6224 56.7969 26.2925 56.4258 25.0352C55.5073 22.8741 55 20.4962 55 18C55 8.05887 63.0589 0 73 0ZM52.2002 75.2002V145H97.2998V132.7H67.2998V75.2002H52.2002Z" fill="white" />
          </svg>

          <svg
            className="tlc-piece tlc-piece-c"
            width="190"
            height="147"
            viewBox="0 0 190 147"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M86 18C86 34.5685 99.4315 48 116 48C132.569 48 146 34.5685 146 18V0H190V131C190 139.837 182.837 147 174 147H43V103L42.9951 102.639C42.8035 95.0737 36.6112 89 29 89C27.6224 89 26.2925 89.2031 25.0352 89.5742C22.8741 90.4927 20.4962 91 18 91C8.05887 91 1.9329e-06 82.9411 0 73C0 63.0589 8.05887 55 18 55C20.4963 55 22.874 55.5082 25.0352 56.4268C26.2924 56.7979 27.6225 57 29 57C36.6112 57 42.8035 50.9263 42.9951 43.3613L43 43V0H86V18ZM118 50.2002C114 50.2002 110.366 50.8329 107.1 52.0996C103.9 53.2996 101.167 55.0671 98.9004 57.4004C96.7004 59.7337 94.9998 62.5671 93.7998 65.9004C92.5999 69.2336 92 73.0004 92 77.2002C92 81.4001 92.5998 85.1667 93.7998 88.5C94.9998 91.8333 96.7004 94.6667 98.9004 97C101.167 99.3332 103.9 101.134 107.1 102.4C110.366 103.6 114.033 104.2 118.1 104.2C123.9 104.2 128.566 103.066 132.1 100.8C135.7 98.4665 138.433 95.3996 140.3 91.5996L129.1 85.2002C127.966 87.3334 126.567 89.0671 124.9 90.4004C123.3 91.7337 121.067 92.4004 118.2 92.4004C114.667 92.4004 111.966 91.4333 110.1 89.5C108.3 87.5001 107.4 84.8001 107.4 81.4004V73C107.4 69.6001 108.3 66.9333 110.1 65C111.966 63 114.6 62 118 62C120.8 62 122.934 62.6667 124.4 64C125.934 65.3333 127.166 67.0002 128.1 69L139.5 62.7998C137.7 58.9999 135.066 55.9668 131.6 53.7002C128.2 51.3669 123.667 50.2002 118 50.2002Z" fill="#6DD3C6" />
          </svg>

          <svg
            className="tlc-pencil"
            width="177"
            height="177"
            viewBox="0 0 177 177"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M50.9266 157.126C47.2003 141.6 34.7792 129.179 19.2529 125.452L22.3582 113.652C42.2318 118.621 57.7581 134.147 62.7266 154.021L50.9266 157.126Z" fill="white" />
            <path d="M0 176.379L15.5263 114.895L108.063 22.3584L154.021 68.3162L61.4841 160.853L0 176.379ZM26.7052 121.106L17.3894 158.99L55.2736 149.674L136.631 68.3162L108.063 39.7478L26.7052 121.106Z" fill="white" />
            <path d="M122.335 45.256L131.117 54.0377L50.3177 134.899L41.536 126.142L122.335 45.256ZM8.69482 167.684L26.7053 163.337C24.8422 156.505 19.8738 151.537 13.0422 149.673L8.69482 167.684ZM157.747 64.5894L111.789 18.6316L130.421 0L133.526 0.621054C155.884 3.72631 173.274 21.1158 176.379 43.4736L177 46.5789L157.747 64.5894ZM129.179 18.6316L157.747 47.1999L163.337 41.6105C160.231 27.3263 149.053 16.1473 134.768 13.0421L129.179 18.6316Z" fill="white" />
          </svg>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .tlc-loader {
          position: fixed;
          top: 0;
          right: 0;
          left: 0;
          z-index: 9999;
          height: 100vh;
          overflow: visible;
          pointer-events: none;
        }

        .tlc-loader-bg {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 100vh;
          background: var(--color-primary);
        }

        .tlc-loader-exiting .tlc-loader-bg {
          animation: loaderBecomeNavbar 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .tlc-loader-stage {
          --tlc-dock-x: 0px;
          --tlc-dock-y: 0px;
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(86vw, 620px);
          aspect-ratio: 620 / 430;
          transform: translate(-50%, -50%);
        }

        .tlc-loader-exiting .tlc-loader-stage {
          animation: logoSlideToNavbar 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .tlc-final-logo {
          position: absolute;
          inset: 0;
          transform-origin: center;
          transform: scale(0.26);
          animation: finalLogoBloom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) 4s forwards;
        }

        .tlc-loader-exiting .tlc-final-logo {
          animation: logoScaleToNavbar 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .tlc-piece,
        .tlc-line,
        .tlc-pencil {
          position: absolute;
          display: block;
          overflow: visible;
          transform-box: fill-box;
          transform-origin: center;
          will-change: clip-path, filter, opacity, transform;
        }

        .tlc-line {
          z-index: 5;
          filter: drop-shadow(0 5px 9px rgba(0, 107, 95, 0.08));
          clip-path: inset(0 100% 0 0);
        }

        /* Line drawing: the pencil reveals each stroke from left to right. */
        .tlc-line-bottom {
          left: 15%;
          top: 84.2%;
          width: 70%;
          height: auto;
          transform: scaleY(1.22);
          animation: drawLine 0.75s cubic-bezier(0.34, 1, 0.64, 1) 1.75s forwards;
        }

        .tlc-line-middle {
          left: 12%;
          top: 73.4%;
          width: 78%;
          height: auto;
          transform: scaleY(1.2);
          animation: drawLine 0.75s cubic-bezier(0.34, 1, 0.64, 1) 2.5s forwards;
        }

        /* Pencil writing pass: it appears after the pieces solve, writes the lines, then rests in the logo. */
        .tlc-pencil {
          left: 22%;
          top: 51.8%;
          z-index: 6;
          width: 21.5%;
          height: auto;
          opacity: 0;
          filter:
            drop-shadow(0 12px 16px rgba(0, 107, 95, 0.16))
            drop-shadow(0 0 1px rgba(0, 107, 95, 0.55));
          transform: translate3d(-18%, -6%, 0) rotate(-8deg) scale(0.9);
          animation:
            pencilWrite 1.55s cubic-bezier(0.4, 0, 0.2, 1) 1.7s forwards,
            pencilRestOnC 0.45s cubic-bezier(0.19, 1, 0.22, 1) 3.55s forwards;
        }

        .tlc-piece {
          z-index: 4;
          filter: drop-shadow(0 14px 22px rgba(0, 107, 95, 0.1));
          opacity: 0;
        }

        /* Puzzle solving: each separate piece enters from its own direction and snaps into place. */
        .tlc-piece-t {
          left: 19.5%;
          top: 5.2%;
          width: 30.7%;
          height: auto;
          animation: pieceTEnter 0.7s cubic-bezier(0.19, 1, 0.22, 1) 0.25s forwards;
        }

        .tlc-piece-l {
          left: 19.5%;
          top: 33.6%;
          width: 23.7%;
          height: auto;
          filter:
            drop-shadow(0 14px 22px rgba(0, 107, 95, 0.16))
            drop-shadow(0 0 1px rgba(0, 107, 95, 0.3));
          animation: pieceLEnter 0.7s cubic-bezier(0.19, 1, 0.22, 1) 0.5s forwards;
        }

        .tlc-piece-c {
          left: 43.2%;
          top: 43.2%;
          width: 30.7%;
          height: auto;
          animation: pieceCEnter 0.7s cubic-bezier(0.19, 1, 0.22, 1) 0.75s forwards;
        }

        @keyframes drawLine {
          to {
            clip-path: inset(0 0 0 0);
          }
        }

        @keyframes pencilWrite {
          0% {
            opacity: 0;
            transform: translate3d(-18%, -6%, 0) rotate(-8deg) scale(0.9);
          }

          11% {
            opacity: 1;
            transform: translate3d(-22%, 18%, 0) rotate(-8deg) scale(1);
          }

          48% {
            opacity: 1;
            transform: translate3d(238%, 18%, 0) rotate(-8deg) scale(1);
          }

          56% {
            transform: translate3d(-34%, -12%, 0) rotate(-8deg) scale(1);
          }

          88% {
            opacity: 1;
            transform: translate3d(270%, -12%, 0) rotate(-8deg) scale(1);
          }

          100% {
            opacity: 0;
            transform: translate3d(284%, -16%, 0) rotate(-8deg) scale(0.96);
          }
        }

        @keyframes pencilRestOnC {
          0% {
            opacity: 0;
            transform: translate3d(284%, -16%, 0) rotate(-8deg) scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translate3d(142%, -154%, 0) rotate(-8deg) scale(1.14);
          }
        }

        @keyframes pieceTEnter {
          0% {
            opacity: 0;
            transform: translate3d(0, -58%, 0) rotate(-8deg) scale(0.96);
          }

          72% {
            opacity: 1;
            transform: translate3d(0, 2.5%, 0) rotate(1deg) scale(1.035);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes pieceLEnter {
          0% {
            opacity: 0;
            transform: translate3d(-62%, 7%, 0) rotate(8deg) scale(0.96);
          }

          72% {
            opacity: 1;
            transform: translate3d(2.5%, 0, 0) rotate(-1deg) scale(1.035);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
        }

        @keyframes pieceCEnter {
          0% {
            opacity: 0;
            transform: translate3d(66%, 5%, 0) rotate(-8deg) scale(0.96);
          }

          72% {
            opacity: 1;
            transform: translate3d(-2.5%, 0, 0) rotate(1deg) scale(1.035);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
        }

        /* Final logo reveal: a tiny brand-friendly lift and very soft glow. */
        @keyframes finalLogoBloom {
          0% {
            filter: drop-shadow(0 0 0 rgba(109, 211, 198, 0));
            transform: scale(0.26);
          }

          70% {
            filter: drop-shadow(0 18px 26px rgba(0, 107, 95, 0.1))
              drop-shadow(0 0 18px rgba(109, 211, 198, 0.22));
            transform: scale(0.29);
          }

          100% {
            filter: drop-shadow(0 16px 22px rgba(0, 107, 95, 0.08))
              drop-shadow(0 0 12px rgba(109, 211, 198, 0.16));
            transform: scale(0.28);
          }
        }

        /* Final transition: the loader background shrinks into the navbar height. */
        @keyframes loaderBecomeNavbar {
          to {
            height: 72px;
          }
        }

        /* Final transition: the animated logo slides directly to the real navbar logo slot. */
        @keyframes logoSlideToNavbar {
          to {
            transform: translate(
              calc(-50% + var(--tlc-dock-x)),
              calc(-50% + var(--tlc-dock-y))
            );
          }
        }

        @keyframes logoScaleToNavbar {
          to {
            filter: none;
            transform: scale(0.078);
          }
        }

        @keyframes loaderFadeOut {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        @media (max-width: 640px) {
          .tlc-loader-stage {
            width: min(94vw, 430px);
            aspect-ratio: 620 / 500;
          }

          .tlc-final-logo {
            transform: translateY(-2%) scale(0.26);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tlc-loader {
            animation-duration: 0.2s;
            animation-delay: 0.6s;
          }

          .tlc-final-logo,
          .tlc-line,
          .tlc-pencil,
          .tlc-piece {
            animation-duration: 0.001s;
            animation-delay: 0s;
          }

          .tlc-line {
            clip-path: inset(0 0 0 0);
          }

          .tlc-pencil {
            opacity: 0;
          }

          .tlc-piece {
            opacity: 1;
          }
        }
      `}</style>

      <style jsx global>{`
        /* The real navbar and page stay mounted but hidden while the loader acts as the navbar. */
        body.tlc-page-loading main > :not(.tlc-loader) {
          opacity: 0;
        }

        body.tlc-page-revealing main > nav {
          opacity: 0;
        }

        body.tlc-page-revealing main > :not(.tlc-loader):not(nav) {
          opacity: 1;
          transition: opacity 0.4s ease 0.35s;
        }

        body:not(.tlc-page-loading) main > :not(.tlc-loader) {
          opacity: 1;
          transition: opacity 0.2s ease;
        }
      `}</style>
    </div>
  );
}
