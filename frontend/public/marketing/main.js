const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");
if (burger && drawer) {
  burger.addEventListener("click", () => drawer.classList.toggle("open"));
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => drawer.classList.remove("open")));
}

const video = document.getElementById("bg");
if (video) {
  video.play().catch(() => {});
}
