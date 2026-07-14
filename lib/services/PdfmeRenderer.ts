import { generate } from "@pdfme/generator";
import { text, image, barcodes } from "@pdfme/schemas";
import { ICertificateRenderer } from "../interfaces/ICertificateRenderer";

export class PdfmeRenderer implements ICertificateRenderer {
  async render(template: any, inputs: Record<string, any>[]): Promise<Uint8Array> {
    const plugins = { text, image, qrcode: barcodes.qrcode };
    const pdfBuffer = await generate({ template, inputs, plugins });
    return pdfBuffer;
  }
}
