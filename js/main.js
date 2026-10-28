/* =========================================================
   Цагана Боваева — interactions
   ========================================================= */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Header ---------- */

  const header = document.querySelector("[data-header]");

  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuToggle && mobileMenu) {
    const menuBackground = document.querySelectorAll("main, footer, .mobile-booking, .skip-link, .header-inner .brand, .header-inner .nav, .header-actions > a");

    const setMenu = (open, restoreFocus = false) => {
      const wasOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (!open && !wasOpen) return;
      if (!open && mobileMenu.contains(document.activeElement)) menuToggle.focus();
      if (!open && restoreFocus) menuToggle.focus();
      mobileMenu.inert = !open;
      menuBackground.forEach((element) => { element.inert = open; });
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute(
        "aria-label",
        open ? "Закрыть меню" : "Открыть меню"
      );
      mobileMenu.setAttribute("aria-hidden", String(!open));
      mobileMenu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) mobileMenu.querySelector("a")?.focus();
    };

    menuToggle.addEventListener("click", () => {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    window.addEventListener("keydown", (event) => {
      if (menuToggle.getAttribute("aria-expanded") !== "true") return;
      if (event.key === "Escape") setMenu(false, true);
      if (event.key !== "Tab") return;
      const links = Array.from(mobileMenu.querySelectorAll("a[href]"));
      const first = menuToggle;
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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

    items.forEach((item, index) => {
      const button = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      if (!button || !answer) return;
      button.id = `faq-question-${index + 1}`;
      answer.id = `faq-answer-${index + 1}`;
      button.setAttribute("aria-controls", answer.id);
      answer.setAttribute("role", "region");
      answer.setAttribute("aria-labelledby", button.id);
      answer.inert = true;
      answer.setAttribute("aria-hidden", "true");

      button.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");

        items.forEach((other) => {
          other.classList.remove("is-open");
          const otherButton = other.querySelector(".faq-question");
          if (otherButton) otherButton.setAttribute("aria-expanded", "false");
          const otherAnswer = other.querySelector(".faq-answer");
          if (otherAnswer) {
            otherAnswer.inert = true;
            otherAnswer.setAttribute("aria-hidden", "true");
          }
        });

        if (!isOpen) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
          answer.inert = false;
          answer.setAttribute("aria-hidden", "false");
        }
      });
    });
  }

  /* ---------- Price search and categories ---------- */

  const priceList = document.querySelector("[data-price-list]");

  if (priceList) {
    const search = priceList.querySelector("[data-price-search]");
    const categoryFilter = priceList.querySelector("[data-price-category-filter]");
    const reset = priceList.querySelector("[data-price-reset]");
    const status = priceList.querySelector("[data-price-count]");
    const empty = priceList.querySelector("[data-price-empty]");
    const tools = priceList.querySelector("[data-price-tools]");
    const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
    const serviceWord = (count) => {
      const lastTwo = count % 100;
      if (lastTwo >= 11 && lastTwo <= 14) return "услуг";
      if (count % 10 === 1) return "услуга";
      if (count % 10 >= 2 && count % 10 <= 4) return "услуги";
      return "услуг";
    };

    if (search && categoryFilter && reset && status && empty && tools) {
      const categories = Array.from(priceList.querySelectorAll(".price-category")).map((element) => {
        const name = element.querySelector(".price-category-name").textContent.trim();
        categoryFilter.add(new Option(name, name));
        return {
          element,
          name,
          count: element.querySelector("[data-price-category-count]"),
          rows: Array.from(element.querySelectorAll(".price-row")).map((row) => ({
            element: row,
            text: normalize(`${row.querySelector(".price-name").textContent} ${name}`),
          })),
        };
      });
      const total = categories.reduce((sum, category) => sum + category.rows.length, 0);
      let wasFiltered = false;
      let openBeforeFiltering = new Set();

      const updatePrices = () => {
        const aliases = { губы: "губ", ботулинотерапия: "ботокс", fullface: "фулфейс" };
        const query = normalize(search.value).replace(/full\s+face/g, "фулфейс");
        const words = query.split(" ").filter(Boolean).map((word) => aliases[word] || word);
        const filtered = words.length > 0 || Boolean(categoryFilter.value);
        if (filtered && !wasFiltered) {
          openBeforeFiltering = new Set(categories.filter(({ element }) => element.open).map(({ element }) => element));
        }
        let found = 0;
        categories.forEach((category) => {
          const selected = !categoryFilter.value || categoryFilter.value === category.name;
          let count = 0;
          category.rows.forEach((row) => {
            const matches = selected && words.every((word) => row.text.includes(word));
            row.element.hidden = !matches;
            if (matches) count += 1;
          });
          category.element.hidden = count === 0;
          if (filtered) category.element.open = count > 0;
          else if (wasFiltered) category.element.open = openBeforeFiltering.has(category.element);
          if (category.count) category.count.textContent = `${count} ${serviceWord(count)}`;
          found += count;
        });
        status.textContent = filtered ? `Найдено: ${found} из ${total}` : `Всего: ${total} ${serviceWord(total)}`;
        empty.hidden = found !== 0;
        reset.disabled = !search.value && !categoryFilter.value;
        wasFiltered = filtered;
      };

      search.addEventListener("input", updatePrices);
      categoryFilter.addEventListener("change", updatePrices);
      reset.addEventListener("click", () => {
        search.value = "";
        categoryFilter.value = "";
        updatePrices();
        search.focus();
      });
      updatePrices();
      tools.hidden = false;
    }
  }

  /* ---------- Featured before / after comparison ---------- */

  document.querySelectorAll("[data-comparison]").forEach((comparison) => {
    const media = comparison.querySelector("[data-comparison-media]");
    const range = comparison.querySelector("[data-comparison-range]");
    if (!media || !range) return;

    const update = () => {
      const before = Math.min(100, Math.max(0, Number(range.value)));
      media.style.setProperty("--comparison-position", `${before}%`);
      range.setAttribute("aria-valuetext", `До: ${before}%, после: ${100 - before}%`);
    };

    range.addEventListener("input", update);
    update();
  });

  /* ---------- Procedure details ---------- */

  const serviceDialog = document.querySelector("[data-service-dialog]");
  if (serviceDialog && typeof serviceDialog.showModal === "function") {
    const content = serviceDialog.querySelector("[data-service-content]");
    const close = serviceDialog.querySelector("[data-service-close]");
    let serviceTrigger = null;

    document.querySelectorAll("[data-service]").forEach((card) => {
      const template = document.querySelector(`[data-service-template="${card.dataset.service}"]`);
      if (!template) return;
      card.setAttribute("role", "button");
      card.setAttribute("aria-haspopup", "dialog");
      card.setAttribute("aria-controls", serviceDialog.id);
      card.setAttribute("aria-label", `Подробнее: ${template.content.querySelector("h2").textContent}`);
      card.querySelector(".service-more").hidden = false;
      const open = (event) => {
        event.preventDefault();
        serviceTrigger = card;
        content.replaceChildren(template.content.cloneNode(true));
        serviceDialog.showModal();
        document.body.classList.add("procedure-open");
        close.focus({ preventScroll: true });
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === " ") open(event);
      });
    });
    close.addEventListener("click", () => serviceDialog.close());
    // Only a click outside the actual panel closes the backdrop.
    serviceDialog.addEventListener("click", (event) => {
      const rect = serviceDialog.getBoundingClientRect();
      if (event.target === serviceDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) serviceDialog.close();
      if (event.target.closest("[data-service-booking]")) {
        serviceDialog.close();
        const target = document.querySelector(event.target.closest("a").getAttribute("href"));
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
      }
    });
    serviceDialog.addEventListener("close", () => {
      document.body.classList.remove("procedure-open");
      if (serviceDialog.contains(document.activeElement)) serviceTrigger?.focus({ preventScroll: true });
    });
  }

  /* ---------- Mobile booking shortcut ---------- */

  const mobileBooking = document.querySelector("[data-mobile-booking]");
  const hero = document.querySelector(".hero");
  const booking = document.querySelector("#booking");
  if (mobileBooking && hero && booking) {
    document.body.classList.add("has-mobile-booking");
    const updateMobileBooking = () => {
      mobileBooking.hidden = window.innerWidth > 768 || hero.getBoundingClientRect().bottom > 0 || booking.getBoundingClientRect().top < window.innerHeight;
    };
    window.addEventListener("scroll", updateMobileBooking, { passive: true });
    window.addEventListener("resize", updateMobileBooking);
    if ("ResizeObserver" in window) {
      const layoutObserver = new ResizeObserver(updateMobileBooking);
      layoutObserver.observe(document.querySelector("main"));
    }
    updateMobileBooking();
  }

  /* ---------- Results lightbox ---------- */

  const lightbox = document.querySelector("[data-lightbox]");

  if (lightbox) {
    const lightboxImage = lightbox.querySelector("[data-lightbox-img]");
    const lightboxTitle = lightbox.querySelector("[data-lightbox-title]");
    const lightboxSource = lightbox.querySelector("[data-lightbox-source]");
    const closeButtons = lightbox.querySelectorAll("[data-lightbox-close]");
    let lastFocused = null;
    const lightboxBackground = document.querySelectorAll("header, main, footer, .mobile-booking, .skip-link");

    const closeLightbox = () => {
      lightboxBackground.forEach((element) => { element.inert = false; });
      if (lastFocused) lastFocused.focus();
      lightbox.inert = true;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");
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

      lightbox.inert = false;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");

      const firstClose = lightbox.querySelector(".lightbox-close");
      if (firstClose) firstClose.focus();
      lightboxBackground.forEach((element) => { element.inert = true; });
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
      ).filter((el) => el.tabIndex >= 0 && el.offsetParent !== null);
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
