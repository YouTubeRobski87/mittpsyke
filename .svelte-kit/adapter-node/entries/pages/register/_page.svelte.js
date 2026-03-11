import { h as head, a as attr, e as escape_html } from "../../../chunks/index.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { form } = $$props;
    head("52fghe", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Registrera - MittPsyke</title>`);
      });
      $$renderer3.push(`<meta name="robots" content="noindex, nofollow"/>`);
    });
    $$renderer2.push(`<section class="container max-w-sm py-16"><h1 class="text-2xl font-bold text-center mb-6">Skapa konto</h1> <form method="POST" novalidate="" class="space-y-4"><label class="block text-sm" for="register-email">E-post</label> <input id="register-email" type="email" name="email" placeholder="E-post" autocomplete="email" required=""${attr("aria-describedby", form?.error ? "register-form-error register-password-help" : "register-password-help")} class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"/> <label class="block text-sm" for="register-password">Lösenord</label> <input id="register-password" type="password" name="password" placeholder="Lösenord" required=""${attr("minlength", 6)} autocomplete="new-password"${attr("aria-describedby", form?.error ? "register-form-error register-password-help" : "register-password-help")} class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"/> <p id="register-password-help" class="text-xs opacity-70">Välj minst 6 tecken.</p> `);
    if (form?.error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p id="register-form-error" class="text-red-500 text-sm" role="alert">${escape_html(form.error)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button type="submit" class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium transition-opacity">Registrera</button></form> <p class="text-center text-sm mt-4 opacity-70">Har du redan ett konto? <a href="/login" class="underline">Logga in</a></p></section>`);
  });
}
export {
  _page as default
};
