import"./modulepreload-polyfill-B5Qt9EMX.js";import{b as x}from"./blocks-B7HaWLUF.js";const m=x,C=m.aliases||{},f=m.commands||{},k=Array.isArray(m.sampleScript)?m.sampleScript.join(`
`):"";function T(e){const t=[],n=U(e).split(`
`),i=[],s=new Set;let o=!1;n.forEach((r,w)=>{var b;const l=w+1,c=r.trim();if(!c||c.startsWith("#"))return;if(/^\s+/.test(r)&&O(r)%2!==0&&t.push({severity:"warning",line:l,code:"odd-indentation",message:"Use multiples of two spaces for indentation so nested blocks stay readable."}),N(c)){s.add(S($(c))),o=!1;return}if(V(c)){o=!1;return}if(L(c)){o=!0;return}const g=D(c);if(g){o=!0,s.has(S(g))||t.push({severity:"warning",line:l,code:"sprite-before-definition",message:`Sprite "${g}" has code before its sprite declaration.`});return}const y=R(c),u=v(y);if(!o){if(!u){t.push({severity:"error",line:l,code:"unknown-top-level-line",message:`Unknown top-level line "${y}".`});return}(((b=f[u])==null?void 0:b.kind)||"")!=="meta"&&t.push({severity:"error",line:l,code:"command-outside-code",message:`Command "${u}" should be inside \`stage_code =\` or \`name_code =\`.`});return}if(c.startsWith("@")){t.push({severity:"error",line:l,code:"expression-standalone",message:"Expressions that start with `@` must be used inside another command."});return}if(!u){t.push({severity:"error",line:l,code:"unknown-command",message:`Unknown command "${y}".`});return}if(u==="else"){const p=i[i.length-1];if(!p||!p.allowElse){t.push({severity:"error",line:l,code:"unexpected-else",message:"`else` must follow an open `if` block."});return}if(p.inElse){t.push({severity:"error",line:l,code:"duplicate-else",message:"Only one `else` is allowed for the same `if` block."});return}p.inElse=!0;return}if(u==="end"){if(i.length===0){t.push({severity:"error",line:l,code:"unmatched-end",message:"`end` does not match an open block."});return}i.pop();return}_(u)&&i.push({command:u,line:l,allowElse:u==="if"||u==="if_else",inElse:!1})}),i.forEach(r=>{t.push({severity:"error",line:r.line,code:"missing-end",message:`Block "${r.command}" is missing a closing \`end\`.`})});const a=t.filter(r=>r.severity==="error").length,d=t.length-a;return{ok:a===0,summary:{errors:a,warnings:d,lineCount:n.length},diagnostics:t}}function v(e){const t=A(e);if(f[t])return t;const n=C[t];return n&&f[n]?n:""}function _(e){var n;const t=String(((n=f[e])==null?void 0:n.kind)||"").trim().toLowerCase();return t==="hat"||t==="c"||t==="define"}function R(e){return String(e.split(/\s+/)[0]||"").trim()}function A(e){return String(e||"").trim().toLowerCase()}function U(e){return String(e||"").replace(/\r\n?/g,`
`)}function O(e){const t=e.match(/^ */);return t?t[0].length:0}function L(e){return/^stage_code\s*=$/i.test(e)}function D(e){const t=e.match(/^([a-z0-9_]+)_code\s*=$/i);return!t||String(t[1]).toLowerCase()==="stage"?"":t[1]}function N(e){return/^sprite\s*=/i.test(e)}function V(e){return/^svg\s*=/i.test(e)}function $(e){const[,t=""]=e.split("=");return String(t||"").trim().replace(/^["']|["']$/g,"")}function S(e){return String(e||"").trim().toLowerCase()}const z=`export type ValidationSeverity = "error" | "warning";

export interface ValidationDiagnostic {
  severity: ValidationSeverity;
  line: number;
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  summary: {
    errors: number;
    warnings: number;
    lineCount: number;
  };
  diagnostics: ValidationDiagnostic[];
}

export interface ApiRequestError {
  code: string;
  message: string;
}

export interface ApiValidationMeta {
  endpoint: string;
  source: "input" | "input64" | "sample";
  inputLength: number;
  lineCount: number;
  pretty: boolean;
}

export interface ApiDocs {
  endpoint: string;
  description: string;
  quickStart: string[];
  notes: string[];
}

export interface ApiValidationEnvelope {
  ok: boolean;
  data?: ValidationResult;
  meta?: ApiValidationMeta;
  error?: ApiRequestError;
  docs?: ApiDocs;
}`;J();function J(){const e=B(),t=I(e);P(t,e.pretty)}function B(){const e=new URLSearchParams(window.location.search),t=E(e.get("pretty"),!0),n=String(e.get("format")||"").trim().toLowerCase();if(n&&n!=="json")return{input:null,inputError:null,pretty:t,requestError:{code:"unsupported_format",message:"The `/api/` route is JSON-only. UI and alternate format modes are not supported."},source:null};if(e.has("ts"))return{input:null,inputError:null,pretty:t,requestError:{code:"unsupported_mode",message:"The `/api/` route no longer supports TypeScript-only output. Read the TypeScript contract from the JSON docs object instead."},source:null};if(e.has("code")||e.has("code64"))return{input:null,inputError:null,pretty:t,requestError:{code:"unsupported_parameter",message:"Use `input` or `input64`. Legacy `code` parameters are no longer supported on `/api/`."},source:null};if(E(e.get("sample"),!1))return{input:k,inputError:null,pretty:t,requestError:null,source:"sample"};const i=e.get("input64");if(i!==null){const o=H(i);return{input:o,inputError:o===null?"invalid_input64":null,pretty:t,requestError:null,source:"input64"}}const s=e.get("input");return s!==null?{input:q(s),inputError:null,pretty:t,requestError:null,source:"input"}:{input:null,inputError:null,pretty:t,requestError:null,source:null}}function I(e){if(e.requestError)return{ok:!1,error:e.requestError,docs:h()};if(e.inputError)return{ok:!1,error:{code:e.inputError,message:"The `input64` parameter must be valid base64-encoded UTF-8 text."},docs:h()};if(e.input===null)return{ok:!0,docs:h()};const t=T(e.input);return{ok:t.ok,data:t,meta:{endpoint:`${window.location.origin}${window.location.pathname}`,source:e.source,inputLength:e.input.length,lineCount:M(e.input),pretty:e.pretty}}}function h(){const e=`${window.location.origin}${window.location.pathname}`;return{endpoint:e,description:"Static text2scratch validator route for GitHub Pages.",quickStart:["Open `/api/` with no parameters to read the docs object.","Use `input` for URL-encoded source text or `input64` for base64-encoded UTF-8 text.","Set `pretty=0` when you want compact JSON output.","Use `sample=1` to validate the built-in example script."],notes:["This route always emits JSON text in the document body.","Use `input` for URL-encoded source text.","Use `input64` for multiline or large payloads.","Legacy `code` and `code64` parameters are rejected.","UI and alternate output modes are not supported on this route."],parameters:{input:{type:"string",description:"URL-encoded text2scratch source. Escaped newline sequences like \\\\n are accepted."},input64:{type:"string",description:"Base64-encoded UTF-8 text2scratch source. Preferred for multiline payloads."},pretty:{type:"boolean",default:!0,description:"Pretty-print the JSON response. Use `pretty=0` for compact output."},sample:{type:"boolean",default:!1,description:"Validate the built-in sample script."}},responses:{docs:{description:"Returned when no validation input is provided.",shape:{ok:!0,docs:"ApiDocs"}},validation:{description:"Returned when `input`, `input64`, or `sample=1` is provided.",shape:{ok:"boolean",data:"ValidationResult",meta:{endpoint:"string",source:"input | input64 | sample",inputLength:"number",lineCount:"number",pretty:"boolean"}}},error:{description:"Returned for unsupported query parameters or malformed `input64`.",shape:{ok:!1,error:{code:"string",message:"string"},docs:"ApiDocs"}}},errors:{invalid_input64:"The `input64` value could not be decoded as base64-encoded UTF-8 text.",unsupported_format:"Only JSON output is supported on `/api/`.",unsupported_mode:"TypeScript-only output mode was removed; read the TypeScript contract from `docs.contracts.typescript`.",unsupported_parameter:"Legacy `code` and `code64` parameters are rejected. Use `input` or `input64`."},examples:{docs:{description:"Read the docs object only.",url:e},validate:{description:"Validate source passed directly in the query string.",url:`${e}?input=YOUR_TEXT2SCRATCH_CODE`},validateMultiline:{description:"Validate a multiline snippet using escaped newlines.",url:`${e}?input=stage_code%20%3D%5Cnwhen_flag_clicked%5Cn%20%20say(%22Hello%22)`},validateBase64:{description:"Validate base64-encoded UTF-8 source text.",url:`${e}?input64=BASE64_ENCODED_TEXT2SCRATCH_CODE`},compact:{description:"Return compact JSON instead of pretty-printed JSON.",url:`${e}?input=YOUR_TEXT2SCRATCH_CODE&pretty=0`},sample:{description:"Validate the built-in sample script.",url:`${e}?sample=1`}},contracts:{typescript:z}}}function P(e,t){const n=t?JSON.stringify(e,null,2):JSON.stringify(e),i=typeof e=="object"&&e!==null&&"ok"in e?!!e.ok:!0;document.title="text2scratch | API Protocol",document.documentElement.style.background="#0d1117",document.body.replaceChildren();const s=document.createElement("div");s.style.maxWidth="1000px",s.style.margin="0 auto",s.style.padding="24px";const o=document.createElement("div");o.style.display="flex",o.style.alignItems="center",o.style.justifyContent="space-between",o.style.marginBottom="16px",o.style.borderBottom="1px solid #30363d",o.style.paddingBottom="12px";const a=document.createElement("h1");a.textContent="REST API TERMINAL",a.style.color="#4d97ff",a.style.margin="0",a.style.fontSize="12px",a.style.fontWeight="900",a.style.letterSpacing="0.2em",o.appendChild(a);const d=document.createElement("div");d.textContent=i?"STATUS_OK":"STATUS_ERROR",d.style.color=i?"#3fb950":"#f85149",d.style.fontSize="10px",d.style.fontWeight="bold",o.appendChild(d);const r=document.createElement("pre");r.textContent=n,r.style.margin="0",r.style.whiteSpace="pre-wrap",r.style.wordBreak="break-word",r.style.fontFamily='ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',r.style.fontSize="13px",r.style.lineHeight="1.6",r.style.color="#e6edf3",r.style.background="#161b22",r.style.padding="20px",r.style.borderRadius="8px",r.style.border="1px solid #30363d",r.style.boxShadow="0 4px 20px rgba(0,0,0,0.3)",s.appendChild(o),s.appendChild(r),document.body.appendChild(s),document.body.style.margin="0",document.body.style.background="#0d1117"}function E(e,t){if(e===null)return t;const n=e.trim().toLowerCase();return n==="1"||n==="true"||n==="yes"?!0:n==="0"||n==="false"||n==="no"?!1:t}function q(e){const t=j(e);return t!==null?t:e.replace(/\\r\\n/g,`
`).replace(/\\n/g,`
`).replace(/\\r/g,`
`).replace(/\\t/g,"	")}function j(e){if(!(e.startsWith('"')&&e.endsWith('"')))return null;try{const t=JSON.parse(e);return typeof t=="string"?t:null}catch{return null}}function H(e){try{const t=F(e),n=window.atob(t),i=Uint8Array.from(n,s=>s.charCodeAt(0));return new TextDecoder().decode(i)}catch{return null}}function F(e){const t=e.replace(/-/g,"+").replace(/_/g,"/"),n=t.length%4;return n===0?t:t.padEnd(t.length+(4-n),"=")}function M(e){return e?e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`).length:0}
