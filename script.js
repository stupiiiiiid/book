/* =============================================
   MEMORIES BOOK — Script
   Touch swipe to flip pages, right-to-left
   ============================================= */

(function () {
    'use strict';

    // --- DOM Elements ---
    const book = document.getElementById('book');
    const pages = Array.from(document.querySelectorAll('.page'));
    const particlesContainer = document.getElementById('particles');

    // --- State ---
    let currentPage = 0; // 0 = cover, 1-12 = inner pages
    const totalPages = pages.length; // 13 (cover + 12)
    let isSwiping = false;
    let isAnimating = false;

    // Touch tracking
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let swipeThreshold = 50; // min px to trigger flip

    // --- Initialize ---
    function init() {
        setupPages();
        setupTouchEvents();
        createParticles();
    }

    // Set initial page states
    function setupPages() {
        pages.forEach(function (page, index) {
            if (index === 0) {
                page.classList.add('active');
            }
        });
    }

    // --- Touch / Swipe Handling ---
    function setupTouchEvents() {
        book.addEventListener('touchstart', onTouchStart, { passive: true });
        book.addEventListener('touchmove', onTouchMove, { passive: false });
        book.addEventListener('touchend', onTouchEnd, { passive: true });

        // Mouse fallback (for testing on PC)
        book.addEventListener('mousedown', onMouseDown);
        book.addEventListener('mousemove', onMouseMove);
        book.addEventListener('mouseup', onMouseEnd);
        book.addEventListener('mouseleave', onMouseEnd);
    }

    function onTouchStart(e) {
        if (isAnimating) return;
        var touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchCurrentX = touch.clientX;
        isSwiping = true;

        var activePage = pages[currentPage];
        if (activePage) {
            activePage.classList.add('swiping');
        }
    }

    function onTouchMove(e) {
        if (!isSwiping || isAnimating) return;
        var touch = e.touches[0];
        touchCurrentX = touch.clientX;

        var diffX = touchStartX - touchCurrentX;
        var diffY = Math.abs(touch.clientY - touchStartY);

        // If horizontal swipe is dominant, prevent vertical scroll
        if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
            e.preventDefault();
        }

        // Live page rotation feedback
        var activePage = pages[currentPage];
        if (activePage && Math.abs(diffX) > 10) {
            var maxAngle = 180;
            var angle = 0;

            if (diffX > 0) {
                // Swiping left = forward flip
                angle = Math.min((diffX / 250) * maxAngle, maxAngle);
                activePage.style.transform = 'rotateY(' + (-angle) + 'deg)';
            } else if (diffX < 0 && currentPage > 0) {
                // Swiping right = backward flip (go to previous page)
                var prevPage = pages[currentPage - 1];
                if (prevPage && prevPage.classList.contains('flipped')) {
                    prevPage.classList.add('swiping');
                    var backAngle = Math.max(-180 + (Math.abs(diffX) / 250) * maxAngle, -180);
                    prevPage.style.transform = 'rotateY(' + backAngle + 'deg)';
                }
            }
        }
    }

    function onTouchEnd(e) {
        if (!isSwiping || isAnimating) return;
        isSwiping = false;

        var diffX = touchStartX - touchCurrentX;
        var activePage = pages[currentPage];

        // Remove swiping state, reset inline transforms
        pages.forEach(function (p) {
            p.classList.remove('swiping');
            p.style.transform = '';
        });

        if (Math.abs(diffX) >= swipeThreshold) {
            if (diffX > 0) {
                // Swipe left → next page
                flipForward();
            } else {
                // Swipe right → prev page
                flipBackward();
            }
        }
    }

    // Mouse event handlers (PC fallback)
    var mouseIsDown = false;

    function onMouseDown(e) {
        if (isAnimating) return;
        mouseIsDown = true;
        touchStartX = e.clientX;
        touchStartY = e.clientY;
        touchCurrentX = e.clientX;
        isSwiping = true;

        var activePage = pages[currentPage];
        if (activePage) activePage.classList.add('swiping');
    }

    function onMouseMove(e) {
        if (!mouseIsDown || !isSwiping || isAnimating) return;
        touchCurrentX = e.clientX;

        var diffX = touchStartX - touchCurrentX;
        var activePage = pages[currentPage];

        if (activePage && Math.abs(diffX) > 10) {
            var maxAngle = 180;
            if (diffX > 0) {
                var angle = Math.min((diffX / 250) * maxAngle, maxAngle);
                activePage.style.transform = 'rotateY(' + (-angle) + 'deg)';
            } else if (currentPage > 0) {
                var prevPage = pages[currentPage - 1];
                if (prevPage && prevPage.classList.contains('flipped')) {
                    prevPage.classList.add('swiping');
                    var backAngle = Math.max(-180 + (Math.abs(diffX) / 250) * maxAngle, -180);
                    prevPage.style.transform = 'rotateY(' + backAngle + 'deg)';
                }
            }
        }
    }

    function onMouseEnd(e) {
        if (!mouseIsDown) return;
        mouseIsDown = false;

        isSwiping = false;
        var diffX = touchStartX - touchCurrentX;

        pages.forEach(function (p) {
            p.classList.remove('swiping');
            p.style.transform = '';
        });

        if (Math.abs(diffX) >= swipeThreshold) {
            if (diffX > 0) {
                flipForward();
            } else {
                flipBackward();
            }
        }
    }

    // --- Page Flip Logic ---

    function flipForward() {
        if (isAnimating) return;

        // If on last page, flip it then reset to cover
        if (currentPage >= totalPages - 1) {
            isAnimating = true;
            var page = pages[currentPage];

            page.classList.remove('active');
            page.classList.add('flipping');
            void page.offsetWidth;
            page.classList.add('flipped');

            addFlipSound();

            // After last page flip animation, reset to cover
            setTimeout(function () {
                // Remove all transitions temporarily for instant reset
                pages.forEach(function (p) {
                    p.style.transition = 'none';
                    p.classList.remove('flipped', 'flipping', 'active');
                });

                currentPage = 0;
                pages[0].classList.add('active');

                // Force reflow then restore transitions
                void pages[0].offsetWidth;

                setTimeout(function () {
                    pages.forEach(function (p) {
                        p.style.transition = '';
                    });
                    isAnimating = false;
                }, 50);
            }, 900);

            return;
        }

        isAnimating = true;
        var page = pages[currentPage];

        page.classList.remove('active');
        page.classList.add('flipping');

        // Force reflow before adding flipped class
        void page.offsetWidth;

        // Apply the flip
        page.classList.add('flipped');

        // After animation completes
        var done = false;
        function finish() {
            if (done) return;
            done = true;
            page.removeEventListener('transitionend', onEnd);
            page.classList.remove('flipping');
            isAnimating = false;
        }
        function onEnd(e) {
            if (e.target === page) finish();
        }
        page.addEventListener('transitionend', onEnd);
        // Fallback timeout in case transitionend doesn't fire
        setTimeout(finish, 1000);

        currentPage++;

        // Set the new current page as active
        if (currentPage < totalPages) {
            pages[currentPage].classList.add('active');
        }

        addFlipSound();
    }

    function flipBackward() {
        if (currentPage <= 0 || isAnimating) return;

        isAnimating = true;
        var prevIndex = currentPage - 1;
        var prevPage = pages[prevIndex];

        // Remove active from current
        pages[currentPage].classList.remove('active');

        prevPage.classList.add('flipping');

        // Force reflow
        void prevPage.offsetWidth;

        prevPage.classList.remove('flipped');

        var done = false;
        function finish() {
            if (done) return;
            done = true;
            prevPage.removeEventListener('transitionend', onEnd);
            prevPage.classList.remove('flipping');
            isAnimating = false;
        }
        function onEnd(e) {
            if (e.target === prevPage) finish();
        }
        prevPage.addEventListener('transitionend', onEnd);
        // Fallback timeout
        setTimeout(finish, 1000);

        currentPage = prevIndex;
        prevPage.classList.add('active');

        addFlipSound();
    }

    // --- Subtle haptic / visual feedback on flip ---
    function addFlipSound() {
        // Vibration API (mobile)
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }
    }

    // --- Create floating particles ---
    function createParticles() {
        var count = 15;
        for (var i = 0; i < count; i++) {
            var particle = document.createElement('div');
            particle.classList.add('particle');

            var size = Math.random() * 4 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 12 + 10) + 's';
            particle.style.animationDelay = (Math.random() * 10) + 's';
            particle.style.opacity = Math.random() * 0.4 + 0.1;

            particlesContainer.appendChild(particle);
        }
    }

    // --- Safety: prevent stuck animations ---
    // If transition doesn't fire (edge case), unlock after timeout
    setInterval(function () {
        if (isAnimating) {
            var anyFlipping = false;
            pages.forEach(function (p) {
                if (p.classList.contains('flipping')) anyFlipping = true;
            });
            if (!anyFlipping) {
                isAnimating = false;
            }
        }
    }, 2000);

    // --- Go! ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
