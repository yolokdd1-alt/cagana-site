/* =========================================================
   Цагана Боваева — interactions
   ========================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Header ---------- */

  const header = document.querySelector("[data-header]");
  let lastScroll = 0;

  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
    }
    lastScroll = y;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuToggle && mobileMenu) {
    const setMenu = (open) => {
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute(
        "aria-label",
        open ? "Закрыть меню" : "Открыть меню"
      );
      mobileMenu.setAttribute("aria-hidden", String(!open));
      mobileMenu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
    };

    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) setMenu(false);
    });
  }

  /* ---------- Scroll reveal ---------- */

  const revealItems = document.querySelectorAll(".reveal");

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* reveal visible items already in viewport on load */
  window.addEventListener("load", () => {
    document.querySelectorAll(".reveal").forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        item.classList.add("is-visible");
      }
    });
  });

  /* ---------- FAQ accordion ---------- */

  const accordion = document.querySelector("[data-accordion]");

  if (accordion) {
    const items = Array.from(accordion.querySelectorAll(".faq-item"));

    items.forEach((item) => {
      const button = item.querySelector(".faq-question");
      if (!button) return;

      button.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");

        items.forEach((other) => {
          other.classList.remove("is-open");
          const otherButton = other.querySelector(".faq-question");
          if (otherButton) otherButton.setAttribute("aria-expanded", "false");
        });

        if (!isOpen) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------- Before / after slider ---------- */

  const beforeAfter = document.querySelector("[data-ba]");

  if (beforeAfter) {
    const media = beforeAfter.querySelector(".ba-media");
    const range = beforeAfter.querySelector(".ba-range");

    const update = (value) => {
      if (!media) return;
      const clamped = Math.min(100, Math.max(0, Number(value) || 0));
      media.style.setProperty("--pos", `${clamped}%`);
      if (range) range.setAttribute("aria-valuetext", `${Math.round(clamped)}%`);
    };

    if (range) {
      range.addEventListener("input", (event) => update(event.target.value));
      update(range.value);
    }
  }

  /* ---------- Phone mask ---------- */

  const phoneInput = document.querySelector('input[name="phone"]');

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;
    digits = digits.slice(0, 11);

    const parts = [
      "+7",
      digits.slice(1, 4),
      digits.slice(4, 7),
      digits.slice(7, 9),
      digits.slice(9, 11),
    ];

    let result = parts[0];
    if (parts[1]) result += ` (${parts[1]}`;
    if (parts[1].length === 3) result += ")";
    if (parts[2]) result += ` ${parts[2]}`;
    if (parts[3]) result += `-${parts[3]}`;
    if (parts[4]) result += `-${parts[4]}`;

    return result;
  };

  if (phoneInput) {
    phoneInput.addEventListener("focus", () => {
      if (!phoneInput.value) phoneInput.value = "+7 (";
    });

    phoneInput.addEventListener("blur", () => {
      if (phoneInput.value.replace(/\D/g, "").length <= 1) {
        phoneInput.value = "";
      }
    });

    phoneInput.addEventListener("input", () => {
      const digitsBefore = phoneInput.value.replace(/\D/g, "").length;
      phoneInput.value = formatPhone(phoneInput.value);

      if (digitsBefore <= 1 && !phoneInput.value.startsWith("+7 (")) {
        phoneInput.value = "+7 (";
      }
    });
  }

  /* ---------- Booking form ---------- */

  const form = document.querySelector("[data-booking-form]");

  if (form) {
    const success = form.querySelector("[data-form-success]");
    const nameField = form.querySelector('input[name="name"]');
    const consentField = form.querySelector('input[name="consent"]');

    const setError = (field, message) => {
      const wrapper = field.closest(".field");
      if (wrapper) wrapper.classList.toggle("is-invalid", Boolean(message));

      const errorEl = form.querySelector(
        `[data-error-for="${field.getAttribute("name")}"]`
      );
      if (errorEl) errorEl.textContent = message || "";
    };

    const clearError = (field) => setError(field, "");

    [nameField, phoneInput, consentField].forEach((field) => {
      if (!field) return;
      const eventName = field.type === "checkbox" ? "change" : "input";
      field.addEventListener(eventName, () => clearError(field));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;

      if (!nameField || nameField.value.trim().length < 2) {
        setError(nameField, "Пожалуйста, укажите имя");
        valid = false;
      }

      if (!phoneInput || phoneInput.value.replace(/\D/g, "").length < 11) {
        setError(phoneInput, "Введите номер телефона полностью");
        valid = false;
      }

      if (!consentField || !consentField.checked) {
        setError(consentField, "Необходимо согласие на обработку данных");
        valid = false;
      }

      if (!valid) {
        const firstInvalid = form.querySelector(".is-invalid input");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      form.classList.add("is-sent");
      if (success) {
        success.hidden = false;
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });
  }

  /* ---------- Results lightbox ---------- */

  const lightbox = document.querySelector("[data-lightbox]");

  if (lightbox) {
    const lightboxImage = lightbox.querySelector("[data-lightbox-img]");
    const lightboxTitle = lightbox.querySelector("[data-lightbox-title]");
    const lightboxSource = lightbox.querySelector("[data-lightbox-source]");
    const closeButtons = lightbox.querySelectorAll("[data-lightbox-close]");
    let lastFocused = null;

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
      if (lastFocused) lastFocused.focus();
    };

    const openLightbox = (button) => {
      const { img, title, source } = button.dataset;
      if (!img) return;

      lastFocused = document.activeElement;
      if (lightboxImage) {
        lightboxImage.src = img;
        lightboxImage.alt = `${title || "Результат"} — сравнение до и после`;
      }
      if (lightboxTitle) lightboxTitle.textContent = title || "Результат";
      if (lightboxSource && source) lightboxSource.href = source;

      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");

      const firstClose = lightbox.querySelector(".lightbox-close");
      if (firstClose) firstClose.focus();
    };

    document.querySelectorAll("[data-result]").forEach((button) => {
      button.addEventListener("click", () => openLightbox(button));
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });

    lightbox.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || !lightbox.classList.contains("is-open")) return;

      const focusable = Array.from(
        lightbox.querySelectorAll("button, a[href]")
      ).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- Current year ---------- */

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
