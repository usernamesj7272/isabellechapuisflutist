(() => {
    const carousels = document.querySelectorAll("[data-carousel]");

    carousels.forEach((carousel) => {
        const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
        const previous = carousel.querySelector("[data-carousel-prev]");
        const next = carousel.querySelector("[data-carousel-next]");
        const status = carousel.querySelector(".carousel-status");
        let current = slides.findIndex((slide) => slide.classList.contains("is-active"));

        if (!slides.length || !previous || !next) {
            return;
        }

        if (current < 0) {
            current = 0;
            slides[current].classList.add("is-active");
        }

        const preloadNearby = () => {
            [current - 1, current + 1].forEach((index) => {
                const slide = slides[(index + slides.length) % slides.length];
                const image = slide.querySelector("img");

                if (image) {
                    const preload = new Image();
                    preload.src = image.currentSrc || image.src;
                }
            });
        };

        const update = (index) => {
            slides[current].classList.remove("is-active");
            current = (index + slides.length) % slides.length;
            slides[current].classList.add("is-active");

            if (status) {
                status.textContent = `${current + 1} / ${slides.length}`;
            }

            preloadNearby();
        };

        previous.addEventListener("click", () => update(current - 1));
        next.addEventListener("click", () => update(current + 1));

        carousel.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                update(current - 1);
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                update(current + 1);
            }
        });

        preloadNearby();
    });
})();
