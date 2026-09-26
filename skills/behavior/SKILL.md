---
name: behavior
description: Use when a Block clicks, opens, submits, plays, moves or changes by itself: popups, forms, links, on click actions and purpose behaviours in plain JavaScript.
---

# Behavior

How "on click" and "purpose" Traits work in plain JavaScript. Every pattern here is fake: nothing is sent or saved on a server.

## Must follow

1. Put text a visitor typed on the page with `textContent`, never `innerHTML`.
2. Hide and show parts with the `hidden` attribute. Add `[hidden] { display: none !important; }` to `style.css` once.
3. Every click gives a visible result on the page at once.

## On click

### Go to page

4. Use a plain link: `<a href="shop.html">Shop</a>`. A Button Block that goes to a page is an `<a>` styled as a button.
5. `go to missing page`: write `<a>` with no `href`, and a comment above it: `<!-- The page this linked to was deleted -->`.

### Open popup

6. A Popup is a `<dialog>` opened with `showModal()`. Never write the `open` attribute yourself.
7. Every Popup has a visible close button. Esc closes it by itself.

```html
<button type="button" data-open="signup-popup">Join the club</button>

<!-- Sign-up popup -->
<dialog id="signup-popup" data-block="b9">
  <h2>Join the cake club</h2>
  …
  <button type="button" data-close>Close</button>
</dialog>
```

```js
/* Popups: open from their button, close from their close button */
document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.open).showModal();
  });
});
document.querySelectorAll("dialog [data-close]").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
```

### Shows / hides what's inside

8. Use `<details>` with a `<summary>` that says what opens. No JavaScript.

### Submits (fake)

9. Give each field the right `type`: `email`, `tel`, `number`, `date`. Never block paste.
10. Show an error under its field, set `aria-invalid="true"` on the field, and move focus to the first wrong field.
11. When all fields are right, show a success message in an `aria-live="polite"` area and clear the form. Get each field with `form.elements.namedItem("its-name")`: `form.elements.item` gives back a function, not the field named "item".

```js
/* block b6 */
/* Sign-up form: checks the email, then says thanks. Nothing is sent. */
const signupForm = document.querySelector(".signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", event => {
    event.preventDefault();
    const email = signupForm.elements.namedItem("email");
    const error = signupForm.querySelector(".field-error");
    if (!email.checkValidity()) {
      error.textContent = "Enter an email like sam@example.com.";
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return;
    }
    error.textContent = "";
    email.removeAttribute("aria-invalid");
    signupForm.querySelector(".form-message").textContent = "Thanks! You're on the list.";
    signupForm.reset();
  });
}
```

### Adds to cart (fake)

12. The button says "Added" and a cart count in the Navbar goes up by one. Nothing is saved.

### Plays a sound

13. Play the `sound` Trait's file inside the click handler: `new Audio("assets/bell.mp3").play();`. Never play sound when the page loads.
14. With no `sound` Trait, play a short beep. Every sound comes with a visible change.

```js
/* A short beep for buttons with no sound file */
function beep() {
  const audio = new AudioContext();
  const tone = audio.createOscillator();
  tone.connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + 0.1);
}
```

### Adds to a list, and remembers on this device

15. "Adds to a list": a field and a button add what the visitor typed to a list.
16. "Remembers on this device": save with `localStorage` and show the saved items when the page loads.

```js
/* To-do list: adds tasks and remembers them on this device */
const todoForm = document.querySelector(".todo-form");
if (todoForm) {
  const list = document.querySelector(".todo-list");
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

  function showTask(text) {
    const item = document.createElement("li");
    item.textContent = text;
    list.append(item);
  }

  tasks.forEach(showTask);

  todoForm.addEventListener("submit", event => {
    event.preventDefault();
    const text = todoForm.elements.namedItem("task").value.trim();
    if (!text) return;
    tasks.push(text);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    showTask(text);
    todoForm.reset();
  });
}
```

### Checks an answer, counts clicks

17. "Checks an answer": each answer is a `<button>`. A click shows "Correct!" or "Not quite. The answer is …" in an `aria-live="polite"` area. Store the right answer in a `data-answer` attribute.
18. "Counts clicks": a number next to the button goes up by one per click.

## Purpose

19. **Slideshow:** show one picture at a time and the next one every 4 seconds. Add a Pause button, and stop while the slideshow is off screen.
20. **Countdown:** count down to the date in the request, or to a date two weeks away. Update every second. At zero, show a short message.
21. **Search (fake):** a search field hides the Cards whose text doesn't match, as the visitor types.
22. **Filter / sort (fake):** filter buttons hide Cards by a `data-category` attribute; sorting moves the Cards in the page by a `data-price` or `data-date` attribute.
23. **Appears on scroll:** the Block fades in once when it scrolls into view and never animates again. Use it only where this Trait is.

```js
/* Search: hides the cards that don't match. Nothing is sent. */
const cardSearch = document.querySelector(".card-search");
if (cardSearch) {
  cardSearch.addEventListener("input", () => {
    const words = cardSearch.value.toLowerCase();
    document.querySelectorAll(".card").forEach(card => {
      card.hidden = !card.textContent.toLowerCase().includes(words);
    });
  });
}
```

```js
/* Parts that appear once when they scroll into view */
const appearWatcher = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      appearWatcher.unobserve(entry.target);
    }
  });
});
document.querySelectorAll(".appear").forEach(part => appearWatcher.observe(part));
```

## Video

24. `<video src="assets/tour.mp4" controls preload="metadata"></video>`. Never autoplay with sound.

## Motion

25. Animate only `transform` and `opacity`. Never `transition: all`, never `ease-in`.
26. A button press takes 100–160 ms. A popup opens in 200–350 ms, growing from `scale(0.96)`, never from `scale(0)`.
