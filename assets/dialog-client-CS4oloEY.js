const Y="text2scratch-dialog-styles",w="t2s-dialog-open";let i=null;function V(t={}){return v({...t,mode:"alert"}).then(()=>{})}function F(t={}){return v({...t,mode:"confirm"}).then(a=>!!a)}function I(t={}){return v({...t,mode:"prompt"}).then(a=>typeof a=="string"?a:null)}function v(t){M(),i!=null&&i.forceClose&&i.forceClose(A(i.mode));const a=t.mode||"alert",l=String(t.title||"Confirm action").trim(),c=String(t.message||t.description||"").trim(),f=String(t.confirmLabel||(a==="alert"?"OK":a==="prompt"?"Continue":"Confirm")).trim(),_=String(t.cancelLabel||"Cancel").trim(),g=t.tone==="danger"?"danger":"default",N=String(t.placeholder||"").trim(),j=String(t.defaultValue||""),H=String(t.inputType||"text").trim()||"text",L=typeof t.validate=="function"?t.validate:null,b=a!=="alert";return new Promise(S=>{const u=document.activeElement instanceof HTMLElement?document.activeElement:null;let C=!1,E=!1;const o=document.createElement("div");o.className="t2s-dialog",o.innerHTML=`
      <div class="t2s-dialog__backdrop"></div>
      <div class="t2s-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="t2s-dialog-title">
        <div class="t2s-dialog__header">
          <div>
            <p class="t2s-dialog__eyebrow">${g==="danger"?"Danger zone":"Action required"}</p>
            <h2 id="t2s-dialog-title" class="t2s-dialog__title"></h2>
          </div>
          ${b?'<button type="button" class="t2s-dialog__icon-btn" aria-label="Close dialog">&times;</button>':""}
        </div>
        ${c?'<p class="t2s-dialog__message"></p>':""}
        ${a==="prompt"?`
              <label class="t2s-dialog__field">
                <span class="t2s-dialog__label">${k(t.inputLabel||"Value")}</span>
                <input class="t2s-dialog__input" type="${k(H)}" autocomplete="off">
              </label>
              <p class="t2s-dialog__error" hidden></p>
            `:""}
        <div class="t2s-dialog__actions">
          ${b?`<button type="button" class="t2s-dialog__button t2s-dialog__button--secondary" data-dialog-cancel>${k(_)}</button>`:""}
          <button type="button" class="t2s-dialog__button ${g==="danger"?"t2s-dialog__button--danger":"t2s-dialog__button--primary"}" data-dialog-confirm>${k(f)}</button>
        </div>
      </div>
    `;const s=o.querySelector(".t2s-dialog__panel"),D=o.querySelector(".t2s-dialog__title"),q=o.querySelector(".t2s-dialog__message"),r=o.querySelector(".t2s-dialog__input"),d=o.querySelector(".t2s-dialog__error"),p=o.querySelector("[data-dialog-cancel]"),h=o.querySelector("[data-dialog-confirm]"),y=o.querySelector(".t2s-dialog__icon-btn");D&&(D.textContent=l),q&&(q.textContent=c),r&&(r.value=j,r.placeholder=N);const $=()=>{var e;C||(C=!0,document.removeEventListener("keydown",K,!0),o.remove(),document.body.classList.remove(w),i=null,(e=u==null?void 0:u.focus)==null||e.call(u))},m=(e,n=!1)=>{if(!E){if(E=!0,n){$(),S(e);return}o.classList.remove("is-open"),s==null||s.classList.remove("is-open"),window.setTimeout(()=>{$(),S(e)},180)}},O=e=>{d&&(d.hidden=!1,d.textContent=String(e||"Check this value and try again."))},z=()=>{d&&(d.hidden=!0,d.textContent="")},T=()=>{if(a!=="prompt"){m(a==="confirm"?!0:void 0);return}const e=String((r==null?void 0:r.value)||"");if(L){const n=L(e);if(typeof n=="string"&&n.trim()){O(n),r==null||r.focus();return}}z(),m(e)},x=()=>m(A(a)),K=e=>{if(e.key==="Escape"&&b){e.preventDefault(),x();return}if(e.key==="Enter"&&e.target===r){e.preventDefault(),T();return}e.key==="Tab"&&P(e,o)};h==null||h.addEventListener("click",T),p==null||p.addEventListener("click",x),y==null||y.addEventListener("click",x),o.addEventListener("click",e=>{const n=e.target;b&&(n===o||n instanceof Element&&n.classList.contains("t2s-dialog__backdrop"))&&x()}),r==null||r.addEventListener("input",z),document.addEventListener("keydown",K,!0),document.body.appendChild(o),document.body.classList.add(w),i={mode:a,close:e=>m(e,!1),forceClose:e=>m(e,!0)},requestAnimationFrame(()=>{var e,n;o.classList.add("is-open"),s==null||s.classList.add("is-open"),(n=(e=r||h||p||y)==null?void 0:e.focus)==null||n.call(e)})})}function M(){if(document.getElementById(Y))return;const t=document.createElement("style");t.id=Y,t.textContent=`
    body.${w} {
      overflow: hidden;
    }

    .t2s-dialog {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      opacity: 0;
      transition: opacity 160ms ease;
    }

    .t2s-dialog.is-open {
      opacity: 1;
    }

    .t2s-dialog__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.48);
      backdrop-filter: blur(10px);
    }

    .t2s-dialog__panel {
      position: relative;
      z-index: 1;
      width: min(100%, 30rem);
      border: 1px solid rgba(15, 23, 42, 0.1);
      border-radius: 1.75rem;
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.24);
      padding: 1.4rem;
      transform: translateY(12px) scale(0.98);
      transition: transform 180ms ease;
    }

    .t2s-dialog__panel.is-open {
      transform: translateY(0) scale(1);
    }

    .t2s-dialog__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .t2s-dialog__eyebrow {
      margin: 0 0 0.35rem;
      color: #475569;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .t2s-dialog__title {
      margin: 0;
      color: #0f172a;
      font-size: 1.35rem;
      line-height: 1.2;
    }

    .t2s-dialog__message {
      margin: 1rem 0 0;
      color: #475569;
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .t2s-dialog__field {
      display: grid;
      gap: 0.45rem;
      margin-top: 1rem;
    }

    .t2s-dialog__label {
      color: #334155;
      font-size: 0.92rem;
      font-weight: 600;
    }

    .t2s-dialog__input {
      width: 100%;
      min-height: 3rem;
      border: 1px solid rgba(15, 23, 42, 0.12);
      border-radius: 1rem;
      background: #f8fafc;
      color: #0f172a;
      padding: 0.9rem 1rem;
      font: inherit;
      outline: none;
    }

    .t2s-dialog__input:focus {
      border-color: rgba(15, 23, 42, 0.3);
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.08);
    }

    .t2s-dialog__error {
      margin: 0.55rem 0 0;
      color: #be123c;
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .t2s-dialog__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .t2s-dialog__button,
    .t2s-dialog__icon-btn {
      font: inherit;
      cursor: pointer;
      transition: transform 150ms ease, background-color 150ms ease, border-color 150ms ease, color 150ms ease;
    }

    .t2s-dialog__button {
      min-height: 2.85rem;
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 0.8rem 1.15rem;
      font-size: 0.92rem;
      font-weight: 700;
    }

    .t2s-dialog__button:hover,
    .t2s-dialog__icon-btn:hover {
      transform: translateY(-1px);
    }

    .t2s-dialog__button--primary {
      background: #0f172a;
      color: #fff;
    }

    .t2s-dialog__button--primary:hover {
      background: #1e293b;
    }

    .t2s-dialog__button--danger {
      background: #dc2626;
      color: #fff;
    }

    .t2s-dialog__button--danger:hover {
      background: #b91c1c;
    }

    .t2s-dialog__button--secondary {
      border-color: rgba(15, 23, 42, 0.12);
      background: #fff;
      color: #334155;
    }

    .t2s-dialog__button--secondary:hover {
      border-color: rgba(15, 23, 42, 0.22);
      color: #0f172a;
    }

    .t2s-dialog__icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 999px;
      background: #fff;
      color: #64748b;
      font-size: 1.15rem;
      line-height: 1;
    }

    .t2s-dialog__button:focus-visible,
    .t2s-dialog__icon-btn:focus-visible,
    .t2s-dialog__input:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.12);
    }

    html[data-theme="dark"] .t2s-dialog__panel {
      border-color: rgba(255, 255, 255, 0.12);
      background: rgba(2, 6, 23, 0.96);
      box-shadow: 0 32px 80px rgba(2, 6, 23, 0.48);
    }

    html[data-theme="dark"] .t2s-dialog__eyebrow,
    html[data-theme="dark"] .t2s-dialog__message {
      color: #cbd5e1;
    }

    html[data-theme="dark"] .t2s-dialog__title {
      color: #f8fafc;
    }

    html[data-theme="dark"] .t2s-dialog__label {
      color: #e2e8f0;
    }

    html[data-theme="dark"] .t2s-dialog__input,
    html[data-theme="dark"] .t2s-dialog__button--secondary,
    html[data-theme="dark"] .t2s-dialog__icon-btn {
      border-color: rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.04);
      color: #f8fafc;
    }

    html[data-theme="dark"] .t2s-dialog__input:focus {
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08);
    }

    html[data-theme="dark"] .t2s-dialog__button--primary {
      background: #f8fafc;
      color: #0f172a;
    }

    html[data-theme="dark"] .t2s-dialog__button--primary:hover {
      background: #e2e8f0;
    }

    @media (max-width: 640px) {
      .t2s-dialog {
        padding: 1rem;
      }

      .t2s-dialog__panel {
        width: 100%;
        border-radius: 1.4rem;
        padding: 1.1rem;
      }

      .t2s-dialog__actions {
        display: grid;
        grid-template-columns: 1fr;
      }
    }
  `,document.head.appendChild(t)}function P(t,a){const l=[...a.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter(g=>!g.hasAttribute("disabled")&&g.getAttribute("aria-hidden")!=="true");if(l.length===0){t.preventDefault();return}const c=l[0],f=l[l.length-1],_=document.activeElement;if(t.shiftKey&&_===c){t.preventDefault(),f.focus();return}!t.shiftKey&&_===f&&(t.preventDefault(),c.focus())}function A(t){if(t==="confirm")return!1;if(t==="prompt")return null}function k(t){return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}typeof window<"u"&&(window.text2scratchDialog={alert:V,confirm:F,prompt:I});export{F as s};
