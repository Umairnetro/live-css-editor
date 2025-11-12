function handleDownload() {
  window.location.href =
    "https://github.com/Umairnetro/live-css-editor/releases/download/v1.0.0/live-css-devtools.zip";
}

function handleLearnMore() {
  window.open("https://github.com/Umairnetro/live-css-editor", "_blank");
}

const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

document
  .querySelectorAll(".feature-card, .step, .shortcut-item")
  .forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });
