(() => {
    const carousels = document.querySelectorAll("[data-carousel]");

    const createGalleryLightbox = () => {
        const lightbox = document.createElement("div");
        lightbox.className = "gallery-lightbox";
        lightbox.setAttribute("role", "dialog");
        lightbox.setAttribute("aria-modal", "true");
        lightbox.setAttribute("aria-label", "Photograph preview");
        lightbox.hidden = true;
        lightbox.innerHTML = `
            <button class="gallery-lightbox-close" type="button" aria-label="Close photograph">Close</button>
            <figure class="gallery-lightbox-figure">
                <img class="gallery-lightbox-image" alt="">
                <figcaption class="gallery-lightbox-caption"></figcaption>
            </figure>
        `;
        document.body.append(lightbox);
        return lightbox;
    };

    const lightbox = createGalleryLightbox();
    const lightboxImage = lightbox.querySelector(".gallery-lightbox-image");
    const lightboxCaption = lightbox.querySelector(".gallery-lightbox-caption");
    const lightboxClose = lightbox.querySelector(".gallery-lightbox-close");

    const closeLightbox = () => {
        lightbox.hidden = true;
        document.body.classList.remove("has-gallery-lightbox");
    };

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !lightbox.hidden) {
            closeLightbox();
        }
    });

    carousels.forEach((carousel) => {
        const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
        const previous = carousel.querySelector("[data-carousel-prev]");
        const next = carousel.querySelector("[data-carousel-next]");
        const status = carousel.querySelector(".carousel-status");
        const filters = Array.from(carousel.parentElement.querySelectorAll("[data-gallery-filter]"));
        let current = slides.findIndex((slide) => slide.classList.contains("is-active"));
        let activeFilter = "all";

        if (!slides.length || !previous || !next) {
            return;
        }

        if (current < 0) {
            current = 0;
            slides[current].classList.add("is-active");
        }

        const getVisibleIndexes = () => slides
            .map((slide, index) => ({ slide, index }))
            .filter(({ slide }) => {
                if (activeFilter === "all") {
                    return true;
                }

                const tags = (slide.dataset.galleryTags || "").split(/\s+/);
                return tags.includes(activeFilter);
            })
            .map(({ index }) => index);

        const getVisiblePosition = () => getVisibleIndexes().indexOf(current);

        const preloadNearby = () => {
            const visibleIndexes = getVisibleIndexes();

            if (!visibleIndexes.length) {
                return;
            }

            const position = getVisiblePosition();

            [position - 1, position + 1].forEach((index) => {
                const slide = slides[visibleIndexes[(index + visibleIndexes.length) % visibleIndexes.length]];
                const image = slide.querySelector("img");

                if (image) {
                    const preload = new Image();
                    preload.src = image.currentSrc || image.src;
                }
            });
        };

        let update = (index) => {
            const visibleIndexes = getVisibleIndexes();

            if (!visibleIndexes.length) {
                return;
            }

            slides[current].classList.remove("is-active");

            if (!visibleIndexes.includes(index)) {
                index = visibleIndexes[0];
            }

            current = index;
            slides[current].classList.add("is-active");

            if (status) {
                const visiblePosition = visibleIndexes.indexOf(current);
                status.textContent = `${visiblePosition + 1} / ${visibleIndexes.length}`;
            }

            preloadNearby();
        };

        const thumbList = document.createElement("div");
        thumbList.className = "gallery-thumbnails";
        thumbList.setAttribute("aria-label", "Choose a photograph");

        const thumbs = slides.map((slide, index) => {
            const image = slide.querySelector("img");
            const caption = slide.querySelector("figcaption");
            const button = document.createElement("button");
            button.className = "gallery-thumbnail";
            button.type = "button";
            button.setAttribute("aria-label", `Show photograph ${index + 1}: ${caption ? caption.textContent.trim() : "Gallery photograph"}`);
            button.innerHTML = `<img src="${image ? image.src : ""}" alt="" loading="lazy" decoding="async">`;
            button.addEventListener("click", () => update(index));
            thumbList.append(button);
            return button;
        });

        carousel.after(thumbList);

        const markThumb = () => {
            thumbs.forEach((thumb, index) => {
                const hidden = !getVisibleIndexes().includes(index);
                const selected = index === current;
                thumb.hidden = hidden;
                thumb.classList.toggle("is-active", selected);
                thumb.setAttribute("aria-current", selected ? "true" : "false");
            });
        };

        const openLightbox = (slide) => {
            const link = slide.querySelector("a");
            const image = slide.querySelector("img");
            const caption = slide.querySelector("figcaption");

            if (!link || !image) {
                return;
            }

            lightboxImage.src = link.href;
            lightboxImage.alt = image.alt || "";
            lightboxCaption.innerHTML = caption ? caption.innerHTML : "";
            lightbox.hidden = false;
            document.body.classList.add("has-gallery-lightbox");
            lightboxClose.focus();
        };

        slides.forEach((slide) => {
            const link = slide.querySelector("a");

            if (!link) {
                return;
            }

            link.addEventListener("click", (event) => {
                event.preventDefault();
                openLightbox(slide);
            });
        });

        const originalUpdate = update;
        update = (index) => {
            originalUpdate(index);
            markThumb();
        };

        const moveVisible = (offset) => {
            const visibleIndexes = getVisibleIndexes();
            const position = getVisiblePosition();

            if (!visibleIndexes.length) {
                return;
            }

            update(visibleIndexes[(position + offset + visibleIndexes.length) % visibleIndexes.length]);
        };

        previous.addEventListener("click", () => moveVisible(-1));
        next.addEventListener("click", () => moveVisible(1));

        carousel.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveVisible(-1);
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                moveVisible(1);
            }
        });

        filters.forEach((button) => {
            button.addEventListener("click", () => {
                activeFilter = button.dataset.galleryFilter || "all";

                filters.forEach((filter) => {
                    const selected = filter === button;
                    filter.classList.toggle("is-active", selected);
                    filter.setAttribute("aria-pressed", selected ? "true" : "false");
                });

                slides.forEach((slide, index) => {
                    slide.hidden = !getVisibleIndexes().includes(index);
                });

                update(getVisibleIndexes()[0]);
            });
        });

        preloadNearby();
        slides.forEach((slide, index) => {
            slide.hidden = !getVisibleIndexes().includes(index);
        });
        markThumb();
    });
})();
