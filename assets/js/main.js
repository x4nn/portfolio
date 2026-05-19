const portfolioProfile = {
    name: "Xander Detruyer",
    title: "Junior Software Engineer",
    diploma: "Professionele bachelor Software Engineering",
    email: "xander.detruyer@gmail.com",
    linkedinUrl: "https://www.linkedin.com/in/xander-detruyer-6b0bb9297",
    linkedinLabel: "linkedin.com/in/xander-detruyer-6b0bb9297",
    githubUrl: "https://github.com/x4nn",
    githubLabel: "github.com/x4nn",
    location: "België, beschikbaar voor remote en hybride",
    cvUrl: "https://example.com/xander-cv.pdf"
};

const state = {
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
};

const dom = {
    siteHeader: document.querySelector("[data-site-header]"),
    navToggleButton: document.querySelector("[data-nav-toggle]"),
    siteNavigation: document.querySelector("[data-site-nav]"),
    navigationLinks: document.querySelectorAll(".nav-link"),
    revealElements: document.querySelectorAll(".reveal"),
    skillProgressBars: document.querySelectorAll(".skill-progress"),
    yearElement: document.querySelector("[data-year]"),
    contactForm: document.querySelector("[data-contact-form]"),
    heroPanel: document.querySelector("[data-parallax]"),
    buttons: document.querySelectorAll(".button")
};

const updateTextNodes = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
        element.textContent = value;
    });
};

const updateLinkNodes = (selector, href, label) => {
    document.querySelectorAll(selector).forEach((linkElement) => {
        if (href) {
            linkElement.setAttribute("href", href);
        }

        if (label) {
            linkElement.textContent = label;
        }
    });
};

const bindProfileContent = () => {
    updateTextNodes("[data-profile-name]", portfolioProfile.name);
    updateTextNodes("[data-profile-title]", portfolioProfile.title);
    updateTextNodes("[data-profile-diploma]", portfolioProfile.diploma);
    updateTextNodes("[data-profile-email]", portfolioProfile.email);
    updateTextNodes("[data-profile-location]", portfolioProfile.location);

    updateLinkNodes("[data-profile-email-link]", `mailto:${portfolioProfile.email}`);
    updateLinkNodes("[data-profile-linkedin-link]", portfolioProfile.linkedinUrl);
    updateLinkNodes("[data-profile-github-link]", portfolioProfile.githubUrl);
    updateLinkNodes("[data-profile-cv]", portfolioProfile.cvUrl);

    updateTextNodes("[data-profile-linkedin-label]", portfolioProfile.linkedinLabel);
    updateTextNodes("[data-profile-github-label]", portfolioProfile.githubLabel);
};

const initializeYear = () => {
    if (!dom.yearElement) {
        return;
    }

    dom.yearElement.textContent = String(new Date().getFullYear());
};

const initializeNavigation = () => {
    if (!dom.navToggleButton || !dom.siteNavigation) {
        return;
    }

    const closeNavigation = () => {
        dom.navToggleButton.setAttribute("aria-expanded", "false");
        dom.siteNavigation.classList.remove("open");
    };

    dom.navToggleButton.addEventListener("click", () => {
        const isExpanded = dom.navToggleButton.getAttribute("aria-expanded") === "true";
        dom.navToggleButton.setAttribute("aria-expanded", String(!isExpanded));
        dom.siteNavigation.classList.toggle("open");
    });

    dom.navigationLinks.forEach((navigationLink) => {
        navigationLink.addEventListener("click", closeNavigation);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeNavigation();
        }
    });
};

const initializeActiveSectionTracking = () => {
    const sections = document.querySelectorAll("main section[id]");
    if (!sections.length) {
        return;
    }

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const currentSectionId = entry.target.getAttribute("id");
                dom.navigationLinks.forEach((navigationLink) => {
                    const targetSectionId = navigationLink.getAttribute("href")?.replace("#", "");
                    navigationLink.classList.toggle("active", currentSectionId === targetSectionId);
                });
            });
        },
        {
            threshold: 0.45,
            rootMargin: "-25% 0px -30% 0px"
        }
    );

    sections.forEach((section) => {
        sectionObserver.observe(section);
    });
};

const initializeRevealAnimations = () => {
    if (!dom.revealElements.length) {
        return;
    }

    const staggerGroupCounters = new Map();
    dom.revealElements.forEach((revealElement) => {
        const groupName = revealElement.getAttribute("data-stagger-group") || "default";
        const currentIndex = staggerGroupCounters.get(groupName) || 0;
        revealElement.style.setProperty("--reveal-delay", `${Math.min(currentIndex * 80, 320)}ms`);
        staggerGroupCounters.set(groupName, currentIndex + 1);
    });

    if (state.prefersReducedMotion) {
        dom.revealElements.forEach((revealElement) => {
            revealElement.classList.add("is-visible");
        });
        return;
    }

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.15,
            rootMargin: "0px 0px -10% 0px"
        }
    );

    dom.revealElements.forEach((revealElement) => {
        revealObserver.observe(revealElement);
    });
};

const initializeSkillsAnimation = () => {
    if (!dom.skillProgressBars.length) {
        return;
    }

    const skillsObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const progress = entry.target.getAttribute("data-progress");
                if (progress) {
                    entry.target.style.width = `${progress}%`;
                }

                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.35
        }
    );

    dom.skillProgressBars.forEach((skillProgressBar) => {
        skillsObserver.observe(skillProgressBar);
    });
};

const initializeHeaderShadow = () => {
    if (!dom.siteHeader) {
        return;
    }

    const updateHeaderShadow = () => {
        dom.siteHeader.style.boxShadow = window.scrollY > 8 ? "0 14px 24px rgba(16, 27, 46, 0.08)" : "none";
    };

    updateHeaderShadow();
    window.addEventListener("scroll", updateHeaderShadow, { passive: true });
};

const initializeHeroParallax = () => {
    if (!dom.heroPanel || state.prefersReducedMotion) {
        return;
    }

    let isTicking = false;

    const updateParallax = () => {
        const offset = Math.max(-14, Math.min(window.scrollY * -0.04, 14));
        document.body.style.setProperty("--hero-parallax-y", `${offset}px`);
        isTicking = false;
    };

    window.addEventListener(
        "scroll",
        () => {
            if (isTicking) {
                return;
            }

            isTicking = true;
            window.requestAnimationFrame(updateParallax);
        },
        { passive: true }
    );
};

const initializeMagneticButtons = () => {
    if (state.prefersReducedMotion || !dom.buttons.length) {
        return;
    }

    dom.buttons.forEach((buttonElement) => {
        buttonElement.classList.add("is-magnetic");

        buttonElement.addEventListener("pointermove", (event) => {
            const buttonBounds = buttonElement.getBoundingClientRect();
            const offsetX = event.clientX - (buttonBounds.left + buttonBounds.width / 2);
            const offsetY = event.clientY - (buttonBounds.top + buttonBounds.height / 2);
            const translateX = Math.max(-5, Math.min(offsetX * 0.08, 5));
            const translateY = Math.max(-4, Math.min(offsetY * 0.08 - 2, 4));
            buttonElement.style.transform = `translate(${translateX}px, ${translateY}px)`;
        });

        buttonElement.addEventListener("pointerleave", () => {
            buttonElement.style.removeProperty("transform");
        });
    });
};

const initializeIntroMotion = () => {
    if (state.prefersReducedMotion) {
        return;
    }

    document.body.classList.add("motion-ready");
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            document.body.classList.add("motion-active");
        });
    });
};

const initializeContactForm = () => {
    if (!dom.contactForm) {
        return;
    }

    dom.contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(dom.contactForm);
        const senderName = formData.get("name")?.toString().trim();
        const senderEmail = formData.get("email")?.toString().trim();
        const message = formData.get("message")?.toString().trim();

        if (!senderName || !senderEmail || !message) {
            alert("Vul eerst alle velden in voordat je verzendt.");
            return;
        }

        const subject = encodeURIComponent(`Portfolio contact van ${senderName}`);
        const body = encodeURIComponent(`${message}\n\nNaam: ${senderName}\nEmail: ${senderEmail}`);
        window.location.href = `mailto:${portfolioProfile.email}?subject=${subject}&body=${body}`;
    });
};

function initTheme() {
    const $themeToggleButton = document.getElementById("theme-toggle");
    const $body = document.body;
    const theme = localStorage.getItem("theme") || "light";
    $body.setAttribute("data-theme", theme);

    if (theme === "dark") $themeToggleButton.innerText = "🌙";
    else $themeToggleButton.innerText = "☀️";

    $themeToggleButton.addEventListener("click", () => {
        const currentTheme = localStorage.getItem("theme") || "light";
        const newTheme = currentTheme === "light" ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        $body.setAttribute("data-theme", newTheme);

        if (newTheme === "dark") $themeToggleButton.innerText = "🌙";
        else $themeToggleButton.innerText = "☀️";
    });
}

bindProfileContent();
initializeYear();
initializeNavigation();
initializeActiveSectionTracking();
initializeRevealAnimations();
initializeSkillsAnimation();
initializeHeaderShadow();
initializeHeroParallax();
initializeMagneticButtons();
initializeIntroMotion();
initializeContactForm();
initTheme();
