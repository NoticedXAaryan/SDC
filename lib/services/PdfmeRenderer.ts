import { generate } from "@pdfme/generator";
import { ICertificateRenderer } from "../interfaces/ICertificateRenderer";

export class PdfmeRenderer implements ICertificateRenderer {
  async render(template: any, inputs: Record<string, any>[]): Promise<Uint8Array> {
    const pdfBuffer = await generate({ template, inputs });
    return pdfBuffer;
  }
}
