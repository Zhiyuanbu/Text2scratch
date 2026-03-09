import"./modulepreload-polyfill-B5Qt9EMX.js";import{b as C}from"./blocks-B7HaWLUF.js";const d=C,k=d.aliases||{},p=d.commands||{},v=Array.isArray(d.sampleScript)?d.sampleScript.join(`
`):"";function T(e){const t=[],n=R(e).split(`
`),r=[],c=new Set;let a=!1;n.forEach((u,E)=>{var h;const o=E+1,s=u.trim();if(!s||s.startsWith("#"))return;if(/^\s+/.test(u)&&O(u)%2!==0&&t.push({severity:"warning",line:o,code:"odd-indentation",message:"Use multiples of two spaces for indentation so nested blocks stay readable."}),N(s)){c.add(b($(s))),a=!1;return}if(V(s)){a=!1;return}if(L(s)){a=!0;return}const f=D(s);if(f){a=!0,c.has(b(f))||t.push({severity:"warning",line:o,code:"sprite-before-definition",message:`Sprite "${f}" has code before its sprite declaration.`});return}const g=A(s),i=_(g);if(!a){if(!i){t.push({severity:"error",line:o,code:"unknown-top-level-line",message:`Unknown top-level line "${g}".`});return}(((h=p[i])==null?void 0:h.kind)||"")!=="meta"&&t.push({severity:"error",line:o,code:"command-outside-code",message:`Command "${i}" should be inside \`stage_code =\` or \`name_code =\`.`});return}if(s.startsWith("@")){t.push({severity:"error",line:o,code:"expression-standalone",message:"Expressions that start with `@` must be used inside another command."});return}if(!i){t.push({severity:"error",line:o,code:"unknown-command",message:`Unknown command "${g}".`});return}if(i==="else"){const l=r[r.length-1];if(!l||!l.allowElse){t.push({severity:"error",line:o,code:"unexpected-else",message:"`else` must follow an open `if` block."});return}if(l.inElse){t.push({severity:"error",line:o,code:"duplicate-else",message:"Only one `else` is allowed for the same `if` block."});return}l.inElse=!0;return}if(i==="end"){if(r.length===0){t.push({severity:"error",line:o,code:"unmatched-end",message:"`end` does not match an open block."});return}r.pop();return}x(i)&&r.push({command:i,line:o,allowElse:i==="if"||i==="if_else",inElse:!1})}),r.forEach(u=>{t.push({severity:"error",line:u.line,code:"missing-end",message:`Block "${u.command}" is missing a closing \`end\`.`})});const m=t.filter(u=>u.severity==="error").length,w=t.length-m;return{ok:m===0,summary:{errors:m,warnings:w,lineCount:n.length},diagnostics:t}}function _(e){const t=U(e);if(p[t])return t;const n=k[t];return n&&p[n]?n:""}function x(e){var n;const t=String(((n=p[e])==null?void 0:n.kind)||"").trim().toLowerCase();return t==="hat"||t==="c"||t==="define"}function A(e){return String(e.split(/\s+/)[0]||"").trim()}function U(e){return String(e||"").trim().toLowerCase()}function R(e){return String(e||"").replace(/\r\n?/g,`
`)}function O(e){const t=e.match(/^ */);return t?t[0].length:0}function L(e){return/^stage_code\s*=$/i.test(e)}function D(e){const t=e.match(/^([a-z0-9_]+)_code\s*=$/i);return!t||String(t[1]).toLowerCase()==="stage"?"":t[1]}function N(e){return/^sprite\s*=/i.test(e)}function V(e){return/^svg\s*=/i.test(e)}function $(e){const[,t=""]=e.split("=");return String(t||"").trim().replace(/^["']|["']$/g,"")}function b(e){return String(e||"").trim().toLowerCase()}const J=`export type ValidationSeverity = "error" | "warning";

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
}`;z();function z(){const e=q(),t=B(e);H(t,e.pretty)}function q(){const e=new URLSearchParams(window.location.search),t=S(e.get("pretty"),!0),n=String(e.get("format")||"").trim().toLowerCase();if(n&&n!=="json")return{input:null,inputError:null,pretty:t,requestError:{code:"unsupported_format",message:"The `/api/` route is JSON-only. UI and alternate format modes are not supported."},source:null};if(e.has("ts"))return{input:null,inputError:null,pretty:t,requestError:{code:"unsupported_mode",message:"The `/api/` route no longer supports TypeScript-only output. Read the TypeScript contract from the JSON docs object instead."},source:null};if(e.has("code")||e.has("code64"))return{input:null,inputError:null,pretty:t,requestError:{code:"unsupported_parameter",message:"Use `input` or `input64`. Legacy `code` parameters are no longer supported on `/api/`."},source:null};if(S(e.get("sample"),!1))return{input:v,inputError:null,pretty:t,requestError:null,source:"sample"};const r=e.get("input64");if(r!==null){const a=F(r);return{input:a,inputError:a===null?"invalid_input64":null,pretty:t,requestError:null,source:"input64"}}const c=e.get("input");return c!==null?{input:I(c),inputError:null,pretty:t,requestError:null,source:"input"}:{input:null,inputError:null,pretty:t,requestError:null,source:null}}function B(e){if(e.requestError)return{ok:!1,error:e.requestError,docs:y()};if(e.inputError)return{ok:!1,error:{code:e.inputError,message:"The `input64` parameter must be valid base64-encoded UTF-8 text."},docs:y()};if(e.input===null)return{ok:!0,docs:y()};const t=T(e.input);return{ok:t.ok,data:t,meta:{endpoint:`${window.location.origin}${window.location.pathname}`,source:e.source,inputLength:e.input.length,lineCount:M(e.input),pretty:e.pretty}}}function y(){const e=`${window.location.origin}${window.location.pathname}`;return{endpoint:e,description:"Static text2scratch validator route for GitHub Pages.",quickStart:["Open `/api/` with no parameters to read the docs object.","Use `input` for URL-encoded source text or `input64` for base64-encoded UTF-8 text.","Set `pretty=0` when you want compact JSON output.","Use `sample=1` to validate the built-in example script."],notes:["This route always emits JSON text in the document body.","Use `input` for URL-encoded source text.","Use `input64` for multiline or large payloads.","Legacy `code` and `code64` parameters are rejected.","UI and alternate output modes are not supported on this route."],parameters:{input:{type:"string",description:"URL-encoded text2scratch source. Escaped newline sequences like \\\\n are accepted."},input64:{type:"string",description:"Base64-encoded UTF-8 text2scratch source. Preferred for multiline payloads."},pretty:{type:"boolean",default:!0,description:"Pretty-print the JSON response. Use `pretty=0` for compact output."},sample:{type:"boolean",default:!1,description:"Validate the built-in sample script."}},responses:{docs:{description:"Returned when no validation input is provided.",shape:{ok:!0,docs:"ApiDocs"}},validation:{description:"Returned when `input`, `input64`, or `sample=1` is provided.",shape:{ok:"boolean",data:"ValidationResult",meta:{endpoint:"string",source:"input | input64 | sample",inputLength:"number",lineCount:"number",pretty:"boolean"}}},error:{description:"Returned for unsupported query parameters or malformed `input64`.",shape:{ok:!1,error:{code:"string",message:"string"},docs:"ApiDocs"}}},errors:{invalid_input64:"The `input64` value could not be decoded as base64-encoded UTF-8 text.",unsupported_format:"Only JSON output is supported on `/api/`.",unsupported_mode:"TypeScript-only output mode was removed; read the TypeScript contract from `docs.contracts.typescript`.",unsupported_parameter:"Legacy `code` and `code64` parameters are rejected. Use `input` or `input64`."},examples:{docs:{description:"Read the docs object only.",url:e},validate:{description:"Validate source passed directly in the query string.",url:`${e}?input=YOUR_TEXT2SCRATCH_CODE`},validateMultiline:{description:"Validate a multiline snippet using escaped newlines.",url:`${e}?input=stage_code%20%3D%5Cnwhen_flag_clicked%5Cn%20%20say(%22Hello%22)`},validateBase64:{description:"Validate base64-encoded UTF-8 source text.",url:`${e}?input64=BASE64_ENCODED_TEXT2SCRATCH_CODE`},compact:{description:"Return compact JSON instead of pretty-printed JSON.",url:`${e}?input=YOUR_TEXT2SCRATCH_CODE&pretty=0`},sample:{description:"Validate the built-in sample script.",url:`${e}?sample=1`}},contracts:{typescript:J}}}function H(e,t){const n=t?JSON.stringify(e,null,2):JSON.stringify(e);document.title="text2scratch | API",document.body.replaceChildren(),document.body.textContent=n,document.body.style.margin="0",document.body.style.padding="16px",document.body.style.whiteSpace="pre-wrap",document.body.style.wordBreak="break-word",document.body.style.fontFamily='ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',document.body.style.fontSize="14px",document.body.style.lineHeight="1.5",document.body.style.background="#f7f9fc",document.body.style.color="#13203a"}function S(e,t){if(e===null)return t;const n=e.trim().toLowerCase();return n==="1"||n==="true"||n==="yes"?!0:n==="0"||n==="false"||n==="no"?!1:t}function I(e){const t=P(e);return t!==null?t:e.replace(/\\r\\n/g,`
`).replace(/\\n/g,`
`).replace(/\\r/g,`
`).replace(/\\t/g,"	")}function P(e){if(!(e.startsWith('"')&&e.endsWith('"')))return null;try{const t=JSON.parse(e);return typeof t=="string"?t:null}catch{return null}}function F(e){try{const t=j(e),n=window.atob(t),r=Uint8Array.from(n,c=>c.charCodeAt(0));return new TextDecoder().decode(r)}catch{return null}}function j(e){const t=e.replace(/-/g,"+").replace(/_/g,"/"),n=t.length%4;return n===0?t:t.padEnd(t.length+(4-n),"=")}function M(e){return e?e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`).length:0}
