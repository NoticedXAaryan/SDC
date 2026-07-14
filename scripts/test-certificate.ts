import { PdfmeRenderer } from "../lib/services/PdfmeRenderer";
async function main() {
  const renderer = new PdfmeRenderer();
  const template = {
    basePdf: "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU31jBQsTAz1LBSK0osSQTygwBCIZ2SoYKlgpADm5yYVAwXMgCqAwmZQhTEQG0LxMhD/Xw7mKwBR5hP7CmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNDUKZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1LjI3NiA4NDEuODldL1Jlc291cmNlczw8L0ZvbnQ8PC9GMCA2IDAgUj4+Pj4vQ29udGVudHMgMiAwIFIvUGFyZW50IDUgMCBSPj4KZW5kb2JqCgoxIDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyA1IDAgUj4+CmVuZG9iagoKNSAwIG9iago8PC9UeXBlL1BhZ2VzL0l0cyBbNCAwIFJdL0NvdW50IDE+PgplbmRvYmoKCjYgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoKOCAwIG9iago8PC9DcmVhdG9yKE1hcmluZ2thKS9Qcm9kdWNlcihNYXJpbmdrYSkvQ3JlYXRpb25EYXRlKEQ6MjAyNTAxMDEwMDAwMDBaKT4+CmVuZG9iagoKeHJlZgowIDkKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMjQ5IDAwMDAwIG4gCjAwMDAwMDAwMTkgMDAwMDAgbiAKMDAwMDAwMDExNyAwMDAwMCBuIAowMDAwMDAwMTM2IDAwMDAwIG4gCjAwMDAwMDAyOTYgMDAwMDAgbiAKMDAwMDAwMDM1NSAwMDAwMCBuIAowMDAwMDAwNDQzIDAwMDAwIG4gCjAwMDAwMDA0NDMgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDkvUm9vdCAxIDAgUi9JbmZvIDggMCBSPj4Kc3RhcnR4cmVmCjU1MwolJUVPRg==",
    schemas: [
      {
        text1: {
          type: "text",
          position: { x: 0, y: 0 },
          width: 100,
          height: 10,
        }
      }
    ]
  };
  try {
    await renderer.render(template, [{text1: "Test"}]);
    console.log("Success");
  } catch (err) {
    console.error(err);
  }
}
main();
